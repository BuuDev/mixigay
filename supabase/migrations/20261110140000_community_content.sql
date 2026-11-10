-- Kho quote, giải đấu, từ điển Bộ Tộc do fan góp, skin theo dịp, chapters/Shorts,
-- and reporting wall messages. docs/03-data-model.md "Nội dung cộng đồng (đợt 3)".
-- Fan-submitted tables follow the suggestions model: column grants, pre-moderation,
-- serialized rate-limit triggers, banned authors never approved.

-- ===== Quotes: a moment of a real video, linked with ?t= (never embedded) =====
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  video_id text not null references public.videos on delete cascade,
  at_seconds int not null check (at_seconds between 0 and 86400),
  body text not null check (char_length(body) between 5 and 200),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index quotes_public_idx on public.quotes (approved, created_at desc);
create unique index quotes_same_moment on public.quotes (video_id, at_seconds) where approved;

alter table public.quotes enable row level security;
revoke all on public.quotes from anon, authenticated;
grant select on public.quotes to anon, authenticated;
grant insert (video_id, at_seconds, body) on public.quotes to authenticated;
grant update, delete on public.quotes to authenticated; -- admins only (policies)
create policy quotes_read on public.quotes for select using (approved or author_id = auth.uid() or public.is_admin());
create policy quotes_insert on public.quotes for insert to authenticated
  with check (author_id = auth.uid() and not approved and not public.is_banned());
create policy quotes_admin_update on public.quotes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy quotes_admin_delete on public.quotes for delete to authenticated using (public.is_admin());

create or replace function public.limit_quotes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare today int;
begin
  new.body := public.strip_invisible(new.body);
  if auth.uid() is null then return new; end if;
  if char_length(new.body) < 5 then raise exception 'too_short' using errcode = 'P0422'; end if;
  perform pg_advisory_xact_lock(hashtext('quotes:' || auth.uid()::text));
  select count(*) into today from public.quotes q where q.author_id = auth.uid() and q.created_at > now() - interval '1 day';
  if today >= 5 then raise exception 'rate_limited' using errcode = 'P0429'; end if;
  if today >= 1 and public.account_is_new() then raise exception 'rate_limited_new' using errcode = 'P0429'; end if;
  return new;
end;
$$;
create trigger quotes_rate_limit before insert on public.quotes for each row execute function public.limit_quotes();
create trigger quotes_block_banned_approval before update of approved on public.quotes
  for each row execute function public.block_banned_approval();

-- ===== Glossary entries contributed by fans (the curated list stays in code) =====
create table public.glossary_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  term text not null check (char_length(term) between 2 and 60),
  meaning text not null check (char_length(meaning) between 10 and 300),
  -- Every claim needs a source: a YouTube video of the channel or a news article.
  source_url text not null check (char_length(source_url) <= 300 and source_url ~* '^https://'),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index glossary_term_live on public.glossary_entries (lower(public.f_unaccent(term))) where approved;
alter table public.glossary_entries enable row level security;
revoke all on public.glossary_entries from anon, authenticated;
grant select on public.glossary_entries to anon, authenticated;
grant insert (term, meaning, source_url) on public.glossary_entries to authenticated;
grant update, delete on public.glossary_entries to authenticated;
create policy glossary_read on public.glossary_entries for select using (approved or author_id = auth.uid() or public.is_admin());
create policy glossary_insert on public.glossary_entries for insert to authenticated
  with check (author_id = auth.uid() and not approved and not public.is_banned());
create policy glossary_admin_update on public.glossary_entries for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy glossary_admin_delete on public.glossary_entries for delete to authenticated using (public.is_admin());

create or replace function public.limit_glossary() returns trigger
language plpgsql security definer set search_path = '' as $$
declare today int;
begin
  new.term := public.strip_invisible(new.term);
  new.meaning := public.strip_invisible(new.meaning);
  if auth.uid() is null then return new; end if;
  perform pg_advisory_xact_lock(hashtext('glossary:' || auth.uid()::text));
  select count(*) into today from public.glossary_entries g where g.author_id = auth.uid() and g.created_at > now() - interval '1 day';
  if today >= 3 then raise exception 'rate_limited' using errcode = 'P0429'; end if;
  if today >= 1 and public.account_is_new() then raise exception 'rate_limited_new' using errcode = 'P0429'; end if;
  return new;
end;
$$;
create trigger glossary_rate_limit before insert on public.glossary_entries for each row execute function public.limit_glossary();
create trigger glossary_block_banned_approval before update of approved on public.glossary_entries
  for each row execute function public.block_banned_approval();

-- ===== Tournaments (admin-entered; results only from the official stream) =====
create table public.tournaments (
  slug text primary key check (slug ~ '^[a-z0-9-]{3,60}$'),
  name text not null check (char_length(name) between 2 and 120),
  kind text not null check (kind in ('ao-lang', 'moi-xoang', 'tetris', 'other')),
  starts_on date,
  ends_on date,
  status text not null default 'upcoming' check (status in ('upcoming', 'running', 'finished')),
  description text check (description is null or char_length(description) <= 600),
  video_id text references public.videos on delete set null,
  source_url text check (source_url is null or source_url ~* '^https://'),
  created_at timestamptz not null default now()
);
create table public.tournament_results (
  tournament_slug text not null references public.tournaments on delete cascade on update cascade,
  rank smallint not null check (rank between 1 and 64),
  name text not null check (char_length(name) between 1 and 120),
  note text check (note is null or char_length(note) <= 200),
  primary key (tournament_slug, rank)
);

-- ===== Seasonal skins: admin turns a theme on for a date range =====
create table public.theme_schedule (
  id uuid primary key default gen_random_uuid(),
  theme text not null check (theme in ('tet', 'birthday', 'mixi-cup')),
  label text not null check (char_length(label) between 2 and 80),
  starts_on date not null,
  ends_on date not null,
  check (ends_on >= starts_on)
);

-- Public read, admin write for the three admin-curated tables.
do $$
declare t text;
begin
  foreach t in array array['tournaments', 'tournament_results', 'theme_schedule'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('create policy "%1$s_read" on public.%1$I for select using (true)', t);
    execute format('create policy "%1$s_admin_write" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end;
$$;

-- ===== Videos: chapters (from the description, filled by sync) and Shorts =====
alter table public.videos
  add column chapters jsonb check (chapters is null or jsonb_typeof(chapters) = 'array'),
  -- Shorts are up to 3 minutes since 2024; streams are never Shorts.
  add column is_short boolean generated always as (duration_seconds between 1 and 180 and not was_live) stored;
create index videos_shorts_idx on public.videos (published_at desc) where is_short;

-- ===== Reports: wall messages can be reported too =====
alter table public.reports drop constraint reports_target_kind_check;
alter table public.reports add constraint reports_target_kind_check
  check (target_kind in ('suggestion', 'fan_song', 'profile', 'wall_message'));

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
  elsif new.target_kind = 'wall_message' then
    found_target := exists (select 1 from public.wall_messages w where w.id = new.target_id and w.approved);
  else
    found_target := exists (select 1 from public.profiles p where p.id = new.target_id);
  end if;
  if not found_target then
    raise exception 'not_found' using errcode = 'P0404';
  end if;
  return new;
end;
$$;

-- ===== moderate_user also covers quotes and glossary entries =====
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
  update public.quotes set approved = false where author_id = p_user;
  update public.glossary_entries set approved = false where author_id = p_user;
  delete from public.suggestion_votes where user_id = p_user;
  delete from public.fan_song_votes where user_id = p_user;
  delete from public.attendance where user_id = p_user;
  update public.profiles set display_name = 'Fan ' || left(p_user::text, 4) where id = p_user;
end;
$$;

revoke execute on function public.limit_quotes(), public.limit_glossary() from public, anon, authenticated;
