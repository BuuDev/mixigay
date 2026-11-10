-- P1 community safety + small features (docs/03-data-model.md, "reports", "fan_song_votes",
-- "steam_lookups"). Follows the moderation migration's model: Postgres is the gate.

-- ===== Reports: fans flag a suggestion, a song or a display name =====
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles on delete cascade,
  target_kind text not null check (target_kind in ('suggestion', 'fan_song', 'profile')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'gambling', 'offensive', 'impersonation', 'other')),
  note text check (note is null or char_length(note) <= 300),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  -- One report per fan per target: repeated clicks cannot inflate the count.
  unique (reporter_id, target_kind, target_id)
);
create index reports_open_idx on public.reports (resolved, target_kind, target_id);

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant insert (target_kind, target_id, reason, note) on public.reports to authenticated;
grant select, update, delete on public.reports to authenticated; -- narrowed by the policies below

-- Reporters never read reports back (no oracle on who reported what); admins see all.
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and not resolved and not public.is_banned());
create policy reports_admin_read on public.reports for select to authenticated using (public.is_admin());
create policy reports_admin_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy reports_admin_delete on public.reports for delete to authenticated using (public.is_admin());

-- 20 reports per fan per day; the target must exist and be something the fan can see.
create or replace function public.check_report() returns trigger
language plpgsql security definer set search_path = '' as $$
declare found_target boolean;
begin
  new.note := nullif(public.strip_invisible(new.note), '');
  if auth.uid() is null then return new; end if;
  perform pg_advisory_xact_lock(hashtext('reports:' || auth.uid()::text));
  if (select count(*) from public.reports r
      where r.reporter_id = auth.uid() and r.created_at > now() - interval '1 day') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0429';
  end if;
  -- (A CASE expression inside IF trips the PL/pgSQL parser, hence the IF chain.)
  if new.target_kind = 'suggestion' then
    found_target := exists (select 1 from public.suggestions s where s.id = new.target_id and s.approved and not s.hidden);
  elsif new.target_kind = 'fan_song' then
    found_target := exists (select 1 from public.fan_songs s where s.id = new.target_id and s.approved);
  else
    found_target := exists (select 1 from public.profiles p where p.id = new.target_id);
  end if;
  if not found_target then
    raise exception 'not_found' using errcode = 'P0404';
  end if;
  return new;
end;
$$;
create trigger reports_check before insert on public.reports
  for each row execute function public.check_report();

-- ===== Fan song votes (same model as suggestion_votes) =====
alter table public.fan_songs add column upvotes int not null default 0;

create table public.fan_song_votes (
  song_id uuid not null references public.fan_songs on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (song_id, user_id)
);
alter table public.fan_song_votes enable row level security;
revoke all on public.fan_song_votes from anon, authenticated;
grant select, delete on public.fan_song_votes to authenticated;
grant insert (song_id) on public.fan_song_votes to authenticated;

create policy song_votes_read_own on public.fan_song_votes for select to authenticated using (user_id = auth.uid());
create policy song_votes_insert_own on public.fan_song_votes for insert to authenticated
  with check (
    user_id = auth.uid() and not public.is_banned() and public.can_vote()
    and exists (select 1 from public.fan_songs s where s.id = song_id and s.approved)
  );
create policy song_votes_delete_own on public.fan_song_votes for delete to authenticated using (user_id = auth.uid());

-- Shadow-banned votes "succeed" and are dropped; 60 per hour like suggestion votes.
create or replace function public.limit_song_votes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and trust = -2) then return null; end if;
  perform pg_advisory_xact_lock(hashtext('song_votes:' || auth.uid()::text));
  if (select count(*) from public.fan_song_votes v
      where v.user_id = auth.uid() and v.created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
create trigger fan_song_votes_rate_limit before insert on public.fan_song_votes
  for each row execute function public.limit_song_votes();

create or replace function public.count_song_votes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.fan_songs set upvotes = upvotes + 1 where id = new.song_id;
  else
    update public.fan_songs set upvotes = greatest(upvotes - 1, 0) where id = old.song_id;
  end if;
  return null;
end;
$$;
create trigger fan_song_votes_count after insert or delete on public.fan_song_votes
  for each row execute function public.count_song_votes();

-- moderate_user also withdraws song votes from now on.
create or replace function public.moderate_user(p_user uuid, p_mode text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_mode not in ('ban', 'shadow', 'unban') then raise exception 'bad_mode' using errcode = '22023'; end if;
  update public.profiles
    set trust = case p_mode when 'ban' then -1 when 'shadow' then -2 else 0 end
    where id = p_user;
  if p_mode = 'unban' then return; end if;
  update public.suggestions set hidden = true where author_id = p_user;
  update public.fan_songs set approved = false where author_id = p_user;
  update public.fan_art set approved = false where author_id = p_user;
  update public.quiz_questions set approved = false where author_id = p_user;
  delete from public.suggestion_votes where user_id = p_user;
  delete from public.fan_song_votes where user_id = p_user;
  update public.profiles set display_name = 'Fan ' || left(p_user::text, 4) where id = p_user;
end;
$$;

-- ===== Steam preview: per-fan budget (Steam allows ~200 appdetails per 5 min per IP) =====
create table public.steam_lookups (
  user_id uuid not null references public.profiles on delete cascade,
  at timestamptz not null default now()
);
create index steam_lookups_user_idx on public.steam_lookups (user_id, at);
alter table public.steam_lookups enable row level security;
revoke all on public.steam_lookups from anon, authenticated;

-- Called by /api/steam/[appId] before a lookup: true = allowed (and counted).
-- 20 lookups per 10 minutes per fan; old rows of that fan are pruned on the way.
create or replace function public.take_steam_lookup() returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return false; end if;
  perform pg_advisory_xact_lock(hashtext('steam:' || uid::text));
  delete from public.steam_lookups where user_id = uid and at < now() - interval '1 day';
  if (select count(*) from public.steam_lookups where user_id = uid and at > now() - interval '10 minutes') >= 20 then
    return false;
  end if;
  insert into public.steam_lookups (user_id) values (uid);
  return true;
end;
$$;
revoke execute on function public.take_steam_lookup() from public, anon;
grant execute on function public.take_steam_lookup() to authenticated;

revoke execute on function public.check_report(), public.limit_song_votes(), public.count_song_votes() from public, anon;
