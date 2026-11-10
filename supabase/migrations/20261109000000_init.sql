-- Initial schema. Reference: docs/03-data-model.md

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- unaccent() is only STABLE; an IMMUTABLE wrapper lets it back a generated column and index.
create or replace function public.f_unaccent(text) returns text
language sql immutable parallel safe strict
set search_path = '' as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- ===== Users =====
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users on delete cascade
);

-- Emails that become admins on sign-up (or immediately, if the user already exists).
create table public.admin_emails (
  email text primary key check (email = lower(email))
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1), 'fan'), 50),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  perform public.grant_admin_if_listed(new.id, new.email, new.email_confirmed_at);
  return new;
end;
$$;

-- Admin only for a *confirmed* email: otherwise anyone could sign up with the
-- email/password provider using an admin's address and inherit the role.
create or replace function public.grant_admin_if_listed(p_user uuid, p_email text, p_confirmed timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_confirmed is not null and exists (select 1 from public.admin_emails where email = lower(p_email)) then
    insert into public.admins (user_id) values (p_user) on conflict do nothing;
  end if;
end;
$$;
revoke execute on function public.grant_admin_if_listed(uuid, text, timestamptz) from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_email_confirmed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.grant_admin_if_listed(new.id, new.email, new.email_confirmed_at);
  return new;
end;
$$;

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_email_confirmed();

create or replace function public.grant_admin_for_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.admins (user_id)
  select id from auth.users where lower(email) = new.email and email_confirmed_at is not null
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_admin_email_added
  after insert on public.admin_emails
  for each row execute function public.grant_admin_for_email();

-- ===== Games & classification =====
create table public.games (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  is_vlog boolean not null default false,
  cover_url text,
  steam_app_id int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.game_keywords (
  game_slug text not null references public.games on delete cascade on update cascade,
  keyword text not null check (keyword = lower(keyword) and length(keyword) > 0),
  primary key (game_slug, keyword)
);

-- Official channel playlists, discovered by sync-videos; an admin maps them to a game.
create table public.playlist_game_map (
  playlist_id text primary key,
  playlist_title text,
  game_slug text references public.games on delete set null on update cascade
);

-- ===== Videos & live =====
create type public.live_state as enum ('none', 'upcoming', 'live', 'completed');

create table public.videos (
  video_id text primary key,
  title text not null,
  published_at timestamptz not null,
  duration_seconds int not null default 0,
  view_count bigint not null default 0,
  thumbnail_url text,
  was_live boolean not null default false,
  live_state public.live_state not null default 'none',
  scheduled_start_at timestamptz,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  playlist_ids text[] not null default '{}',
  manual_game_slug text references public.games on delete set null on update cascade,
  auto_game_slug text references public.games on delete set null on update cascade,
  stats_updated_at timestamptz,
  created_at timestamptz not null default now()
);
create index videos_game_idx on public.videos (coalesce(manual_game_slug, auto_game_slug), view_count desc);
create index videos_published_idx on public.videos (published_at desc);
create index videos_live_idx on public.videos (live_state) where live_state in ('upcoming', 'live');

create table public.live_status (
  id boolean primary key default true check (id),
  state text not null check (state in ('live', 'upcoming', 'offline')),
  video_id text references public.videos on delete set null,
  title text,
  start_time timestamptz,
  concurrent_viewers int,
  checked_at timestamptz
);
insert into public.live_status (state) values ('offline');

create table public.live_samples (
  video_id text not null references public.videos on delete cascade,
  sampled_at timestamptz not null,
  concurrent_viewers int not null,
  primary key (video_id, sampled_at)
);

-- ===== Schedule =====
create table public.schedule_slots (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  time_vn time not null,
  title text not null check (char_length(title) between 1 and 120),
  game_slug text references public.games on delete set null on update cascade,
  note text,
  active boolean not null default true
);

create table public.schedule_overrides (
  date_vn date primary key,
  cancelled boolean not null default false,
  time_vn time,
  title text,
  note text
);

-- ===== Played games =====
create type public.play_status as enum ('playing', 'finished', 'dropped');
create table public.played_games (
  game_slug text primary key references public.games on delete cascade on update cascade,
  status public.play_status not null,
  sessions int not null default 0 check (sessions >= 0),
  last_played date
);

-- ===== Suggestions =====
create type public.suggestion_source as enum ('steam', 'viewer-made', 'other');
create type public.suggestion_status as enum ('pending', 'played', 'rejected');

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  name_normalized text generated always as (lower(public.f_unaccent(name))) stored,
  source public.suggestion_source not null,
  url text check (url is null or url ~* '^https?://'),
  reason text not null check (char_length(reason) between 5 and 500),
  status public.suggestion_status not null default 'pending',
  linked_game_slug text references public.games on delete set null on update cascade,
  steam_app_id int,
  steam_data jsonb,
  upvotes int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index suggestions_trgm_idx on public.suggestions using gin (name_normalized extensions.gin_trgm_ops);
create unique index suggestions_steam_uniq on public.suggestions (steam_app_id) where steam_app_id is not null;
create index suggestions_author_idx on public.suggestions (author_id, created_at desc);

create table public.suggestion_votes (
  suggestion_id uuid not null references public.suggestions on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (suggestion_id, user_id)
);
create index suggestion_votes_user_idx on public.suggestion_votes (user_id);

create or replace function public.sync_upvotes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.suggestions set upvotes = upvotes + 1 where id = new.suggestion_id;
  else
    update public.suggestions set upvotes = greatest(upvotes - 1, 0) where id = old.suggestion_id;
  end if;
  return null;
end;
$$;

create trigger suggestion_votes_count
  after insert or delete on public.suggestion_votes
  for each row execute function public.sync_upvotes();

-- Suggestions and played games whose name looks like `q`, for the "already suggested?" hint.
create or replace function public.search_similar(q text)
returns table (kind text, ref text, name text, status text, upvotes int)
language sql stable set search_path = public, extensions as $$
  with needle as (select lower(public.f_unaccent(q)) as n)
  select 'suggestion', s.id::text, s.name, s.status::text, s.upvotes
  from public.suggestions s, needle
  where not s.hidden and (s.name_normalized % needle.n or s.name_normalized like '%' || needle.n || '%')
  union all
  select 'game', g.slug, g.name, coalesce(p.status::text, 'unknown'), 0
  from public.games g left join public.played_games p on p.game_slug = g.slug, needle
  where lower(public.f_unaccent(g.name)) % needle.n or lower(public.f_unaccent(g.name)) like '%' || needle.n || '%'
  limit 8;
$$;

-- ===== Operations (service role only) =====
create table public.api_usage (
  day date not null,
  endpoint text not null,
  units int not null default 0,
  primary key (day, endpoint)
);

-- YouTube quota resets at midnight Pacific time, so the day is counted there.
create or replace function public.add_api_usage(p_endpoint text, p_units int) returns int
language sql set search_path = '' as $$
  insert into public.api_usage (day, endpoint, units)
  values ((now() at time zone 'America/Los_Angeles')::date, p_endpoint, p_units)
  on conflict (day, endpoint) do update set units = public.api_usage.units + excluded.units;
  select coalesce(sum(units), 0)::int from public.api_usage
  where day = (now() at time zone 'America/Los_Angeles')::date;
$$;

-- Bulk update of automatic classification: [{ "video_id": "...", "auto_game_slug": "..." }].
-- Security invoker: RLS limits it to admins (and the service role used by jobs).
create or replace function public.set_auto_game(p_rows jsonb) returns void
language sql set search_path = '' as $$
  update public.videos v set auto_game_slug = r.auto_game_slug
  from jsonb_to_recordset(p_rows) as r(video_id text, auto_game_slug text)
  where v.video_id = r.video_id and v.auto_game_slug is distinct from r.auto_game_slug;
$$;

-- Bulk set playlist membership for one playlist: adds it to `p_video_ids`, removes it elsewhere.
create or replace function public.set_playlist_members(p_playlist_id text, p_video_ids text[]) returns void
language sql set search_path = '' as $$
  update public.videos set playlist_ids = array_remove(playlist_ids, p_playlist_id)
  where p_playlist_id = any (playlist_ids) and not (video_id = any (p_video_ids));
  update public.videos set playlist_ids = array_append(playlist_ids, p_playlist_id)
  where video_id = any (p_video_ids) and not (p_playlist_id = any (playlist_ids));
$$;

revoke execute on function public.add_api_usage(text, int) from public, anon, authenticated;
revoke execute on function public.set_auto_game(jsonb) from public, anon;
-- Explicit grants: do not rely on Supabase's default privileges surviving the revokes above.
grant execute on function public.add_api_usage(text, int) to service_role;
grant execute on function public.set_playlist_members(text, text[]) to service_role;
grant execute on function public.set_auto_game(jsonb) to authenticated, service_role;
revoke execute on function public.set_playlist_members(text, text[]) from public, anon, authenticated;

create table public.notifications_log (
  video_id text not null,
  channel text not null,
  sent_at timestamptz not null default now(),
  primary key (video_id, channel)
);

-- ===== Row level security =====
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.admin_emails enable row level security;
alter table public.games enable row level security;
alter table public.game_keywords enable row level security;
alter table public.playlist_game_map enable row level security;
alter table public.videos enable row level security;
alter table public.live_status enable row level security;
alter table public.live_samples enable row level security;
alter table public.schedule_slots enable row level security;
alter table public.schedule_overrides enable row level security;
alter table public.played_games enable row level security;
alter table public.suggestions enable row level security;
alter table public.suggestion_votes enable row level security;
alter table public.api_usage enable row level security;
alter table public.notifications_log enable row level security;

-- Public content: everyone reads, admins write.
do $$
declare t text;
begin
  foreach t in array array['games', 'game_keywords', 'playlist_game_map', 'videos', 'live_status', 'live_samples',
                           'schedule_slots', 'schedule_overrides', 'played_games']
  loop
    execute format('create policy "%1$s_read" on public.%1$I for select using (true)', t);
    execute format('create policy "%1$s_admin_write" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy admins_read_self on public.admins for select to authenticated using (user_id = auth.uid());

create policy suggestions_read on public.suggestions for select
  using (not hidden or author_id = auth.uid() or public.is_admin());
-- Fans may only write the four free-text columns. Status, moderation, counters and
-- Steam data (fetched server-side, written by the service role) are not theirs to set.
revoke insert, update on public.suggestions from anon, authenticated;
grant insert (name, source, url, reason) on public.suggestions to authenticated;
grant update on public.suggestions to authenticated; -- admins only, via suggestions_admin_update

create policy suggestions_insert on public.suggestions for insert to authenticated
  with check (author_id = auth.uid() and status = 'pending' and not hidden and upvotes = 0);

-- At most 5 suggestions per user per day. A trigger rather than the policy so the
-- advisory lock serializes concurrent inserts by the same user.
create or replace function public.limit_suggestions_per_day() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if; -- service role / admin tooling
  perform pg_advisory_xact_lock(hashtext('suggestions:' || auth.uid()::text));
  if (select count(*) from public.suggestions s
      where s.author_id = auth.uid() and s.created_at > now() - interval '1 day') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0429';
  end if;
  return new;
end;
$$;

create trigger suggestions_rate_limit
  before insert on public.suggestions
  for each row execute function public.limit_suggestions_per_day();
create policy suggestions_admin_update on public.suggestions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy suggestions_admin_delete on public.suggestions for delete to authenticated
  using (public.is_admin());

-- Fans see only their own votes; totals live in suggestions.upvotes.
create policy votes_read_own on public.suggestion_votes for select to authenticated using (user_id = auth.uid());
create policy votes_insert_own on public.suggestion_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.suggestions s where s.id = suggestion_id and not s.hidden)
  );
create policy votes_delete_own on public.suggestion_votes for delete to authenticated
  using (user_id = auth.uid());

create policy api_usage_admin_read on public.api_usage for select to authenticated using (public.is_admin());

-- notifications_log, admin_emails: no policies → service role only.

-- ===== Realtime =====
alter publication supabase_realtime add table public.live_status;
