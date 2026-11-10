-- Bức tường Bộ Tộc (lưu bút), "Tối nay tôi có mặt" (RSVP) and live_samples compaction.
-- docs/03-data-model.md, docs/design/COMPONENTS.md §4–§5. Same model as suggestions:
-- Postgres is the gate (grants, RLS, serialized rate-limit triggers).

-- ===== Wall messages: ≤140 chars, pre-moderated, 3 per day =====
create table public.wall_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check (char_length(body) between 2 and 140),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index wall_messages_public_idx on public.wall_messages (approved, created_at desc);

alter table public.wall_messages enable row level security;
revoke all on public.wall_messages from anon, authenticated;
grant select on public.wall_messages to anon, authenticated;
grant insert (body) on public.wall_messages to authenticated;
grant update, delete on public.wall_messages to authenticated; -- admins only, via the policies below

create policy wall_read on public.wall_messages for select
  using (approved or author_id = auth.uid() or public.is_admin());
create policy wall_insert on public.wall_messages for insert to authenticated
  with check (author_id = auth.uid() and not approved and not public.is_banned());
create policy wall_admin_update on public.wall_messages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Admin-only delete: author deletes would reset the daily limit.
create policy wall_admin_delete on public.wall_messages for delete to authenticated using (public.is_admin());

create or replace function public.limit_wall_messages() returns trigger
language plpgsql security definer set search_path = '' as $$
declare today int;
begin
  new.body := public.strip_invisible(new.body);
  if auth.uid() is null then return new; end if;
  if char_length(new.body) < 2 then raise exception 'too_short' using errcode = 'P0422'; end if;
  perform pg_advisory_xact_lock(hashtext('wall:' || auth.uid()::text));
  select count(*) into today from public.wall_messages w
  where w.author_id = auth.uid() and w.created_at > now() - interval '1 day';
  if today >= 3 then raise exception 'rate_limited' using errcode = 'P0429'; end if;
  if today >= 1 and public.account_is_new() then raise exception 'rate_limited_new' using errcode = 'P0429'; end if;
  perform pg_advisory_xact_lock(hashtext('wall:global'));
  if (select count(*) from public.wall_messages w join public.profiles p on p.id = w.author_id
      where w.created_at > now() - interval '1 hour' and p.trust >= 0) >= 60 then
    raise exception 'rate_limited_global' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
create trigger wall_messages_rate_limit before insert on public.wall_messages
  for each row execute function public.limit_wall_messages();
-- Nothing by a banned or shadow-banned author is ever published.
create trigger wall_messages_block_banned_approval before update of approved on public.wall_messages
  for each row execute function public.block_banned_approval();

-- ===== Attendance: one tap per fan per Vietnam day =====
create table public.attendance (
  date_vn date not null,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (date_vn, user_id)
);
alter table public.attendance enable row level security;
revoke all on public.attendance from anon, authenticated;
grant select, delete on public.attendance to authenticated;
grant insert (date_vn) on public.attendance to authenticated;

create or replace function public.today_vn() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date;
$$;

-- Fans see only their own taps; the public sees the total through attendance_count().
create policy attendance_read_own on public.attendance for select to authenticated using (user_id = auth.uid());
create policy attendance_insert_own on public.attendance for insert to authenticated
  with check (user_id = auth.uid() and date_vn = public.today_vn() and not public.is_banned());
create policy attendance_delete_own on public.attendance for delete to authenticated
  using (user_id = auth.uid() and date_vn = public.today_vn());

-- Shadow-banned taps "succeed" and are dropped, like votes.
create or replace function public.drop_shadow_attendance() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.profiles where id = auth.uid() and trust = -2) then return null; end if;
  return new;
end;
$$;
create trigger attendance_drop_shadow before insert on public.attendance
  for each row execute function public.drop_shadow_attendance();

create or replace function public.attendance_count(p_date date) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.attendance where date_vn = p_date;
$$;
grant execute on function public.attendance_count(date) to anon, authenticated;

-- ===== moderate_user also hides wall messages and withdraws attendance =====
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
  update public.wall_messages set approved = false where author_id = p_user;
  delete from public.suggestion_votes where user_id = p_user;
  delete from public.fan_song_votes where user_id = p_user;
  delete from public.attendance where user_id = p_user;
  update public.profiles set display_name = 'Fan ' || left(p_user::text, 4) where id = p_user;
end;
$$;

-- ===== live_samples: keep one sample per 5 minutes after 30 days (DB stays < 500 MB) =====
-- Run daily by pg_cron (supabase/cron.sql). Returns the number of rows removed.
create or replace function public.compact_live_samples() returns int
language plpgsql security definer set search_path = '' as $$
declare removed int;
begin
  with ranked as (
    select video_id, sampled_at,
           row_number() over (partition by video_id, date_bin('5 minutes', sampled_at, timestamptz '2000-01-01') order by sampled_at) as rn
    from public.live_samples
    where sampled_at < now() - interval '30 days'
  )
  delete from public.live_samples s using ranked r
  where s.video_id = r.video_id and s.sampled_at = r.sampled_at and r.rn > 1;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke execute on function public.limit_wall_messages(), public.drop_shadow_attendance(), public.compact_live_samples() from public, anon, authenticated;
