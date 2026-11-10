-- P0 abuse defenses (docs/03-data-model.md, "Chống phá hoại"). Threat model: free
-- Google accounts, scripts calling PostgREST directly, Vietnamese profanity and
-- gambling ads with obfuscation. Postgres is the gate; the app only adds friendlier
-- errors and a text screen (src/shared/lib/moderation).

-- ===== Trust & bans =====
-- -2 shadow-banned (can still post, nothing is ever approved), -1 banned (cannot post),
--  0 new/normal, 1–2 trusted (reserved for later auto-approval). Fans cannot change it:
-- their only profile column grant is display_name.
alter table public.profiles add column trust smallint not null default 0 check (trust between -2 and 2);
-- profiles are world-readable; trust must not be, or a shadow ban is visible to its target.
revoke select on public.profiles from anon, authenticated;
grant select (id, display_name, avatar_url, created_at) on public.profiles to anon, authenticated;

create or replace function public.is_banned() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and trust = -1);
$$;

create or replace function public.account_is_new() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select created_at > now() - interval '24 hours' from public.profiles where id = auth.uid()), true);
$$;

-- Voting needs an account older than a day (or trust ≥ 1): stops sock-puppet farms.
create or replace function public.can_vote() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    -- trust -2 passes on purpose: the shadow-banned vote "succeeds" and is dropped by the trigger.
    where id = auth.uid() and trust <> -1 and (trust >= 1 or created_at < now() - interval '24 hours')
  );
$$;

-- ===== Display names =====
-- Names show next to every submission, so ads in a Google profile name are rewritten
-- to "Fan ####" (never an error: signing in must not fail).
create table public.banned_terms (
  term text primary key check (term ~ '^[a-z0-9]+$')
);
alter table public.banned_terms enable row level security;
create policy banned_terms_admin on public.banned_terms for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.banned_terms from anon;

-- Mirrored by NAME_BLOCK_STEMS in src/shared/lib/moderation/lexicon.ts (lexicon.test.ts checks).
insert into public.banned_terms (term) values
  ('nhacai'), ('nohu'), ('taixiu'), ('keobong'), ('casino'), ('w88'), ('fb88'), ('188bet'), ('kubet'), ('sunwin'),
  ('go88'), ('rikvip'), ('hitclub'), ('789club'), ('iwin'), ('jun88'), ('new88'), ('shbet'), ('mu88'), ('f8bet'),
  ('8xbet'), ('dmm'), ('dcm'), ('dkm'), ('vcl'), ('ditme'), ('duma'), ('occho');

create or replace function public.strip_invisible(t text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select btrim(regexp_replace(regexp_replace(coalesce(t, ''), '[\u00AD\u034F\u115F\u1160\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u3164\uFEFF]', '', 'g'), '\s+', ' ', 'g'));
$$;

create or replace function public.sanitize_display_name() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n text := public.strip_invisible(new.display_name);
  c text := regexp_replace(lower(public.f_unaccent(n)), '[^a-z0-9]', '', 'g');
begin
  if c = ''
     or n ~* '(://|www\.|[a-z0-9-]{3,}\s*\.\s*(com|net|org|vn|xyz|club|win|bet|vip|top|site|live|me|io|co|cc)(\s|$))'
     or exists (select 1 from public.banned_terms b where position(b.term in c) > 0) then
    n := 'Fan ' || left(new.id::text, 4);
  end if;
  new.display_name := left(n, 50);
  return new;
end;
$$;

create trigger profiles_sanitize_name
  before insert or update of display_name on public.profiles
  for each row execute function public.sanitize_display_name();

-- ===== Suggestions: pre-moderation, URL policy, caps =====
alter table public.suggestions add column approved boolean not null default false;
-- Everything published before this migration stays published.
update public.suggestions set approved = true;

-- Only published rows reserve a name: unreviewed or shadow-banned rows must not block
-- other fans. A second live copy now fails when the admin approves it.
drop index public.suggestions_name_key_live;
create unique index suggestions_name_key_live on public.suggestions (name_key) where approved and not hidden and status <> 'rejected';

-- Profiles are created only by the auth trigger; never by the API roles.
revoke insert, delete, truncate on public.profiles from anon, authenticated;

alter table public.suggestions
  add constraint suggestions_url_len check (url is null or char_length(url) <= 500),
  add constraint suggestions_url_https check (url is null or url ~* '^https://'),
  add constraint suggestions_url_tricks check (
    url is null or (
      url !~ '^https://[^/?#]*@'                    -- "https://store.steampowered.com@evil.example"
      and url !~* '^https://([^/?#]*\.)?xn--'        -- punycode look-alike hosts
      and url !~* '^https://(www\.)?(bit\.ly|tinyurl\.com|t\.co|cutt\.ly|s\.id|is\.gd|rb\.gy|shorturl\.at|tiny\.cc|ow\.ly|goo\.gl|v\.gd)([/?#]|$)'
    )
  );

drop policy suggestions_read on public.suggestions;
create policy suggestions_read on public.suggestions for select
  using ((approved and not hidden) or author_id = auth.uid() or public.is_admin());

drop policy suggestions_insert on public.suggestions;
create policy suggestions_insert on public.suggestions for insert to authenticated
  -- No "not hidden" here: fans have no grant on hidden, and the trigger sets it for shadow bans.
  with check (author_id = auth.uid() and status = 'pending' and not approved and upvotes = 0 and not public.is_banned());

-- One serialized trigger for every per-fan and global guard (replaces the version in
-- 20261110080000). SECURITY DEFINER so duplicate checks also see other fans' pending rows.
create or replace function public.limit_suggestions_per_day() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  k text;
  dup text;
  dup_public boolean;
  today int;
begin
  new.name := public.strip_invisible(new.name);
  new.reason := public.strip_invisible(new.reason);
  if auth.uid() is null then return new; end if; -- service role / admin tooling
  if char_length(new.reason) < 5 then raise exception 'too_short' using errcode = 'P0422'; end if;
  k := regexp_replace(lower(public.f_unaccent(new.name)), '[^a-z0-9]+', '', 'g');

  perform pg_advisory_xact_lock(hashtext('suggestions:' || auth.uid()::text));
  select count(*) into today from public.suggestions s
  where s.author_id = auth.uid() and s.created_at > now() - interval '1 day';
  if today >= 5 then raise exception 'rate_limited' using errcode = 'P0429'; end if;
  if today >= 2 and public.account_is_new() then raise exception 'rate_limited_new' using errcode = 'P0429'; end if;
  if exists (select 1 from public.suggestions s
             where s.author_id = auth.uid() and s.created_at > now() - interval '10 minutes') then
    raise exception 'cooldown' using errcode = 'P0429';
  end if;

  perform pg_advisory_xact_lock(hashtext('suggestions:global'));
  if (select count(*) from public.suggestions s join public.profiles p on p.id = s.author_id
      where s.created_at > now() - interval '1 hour' and p.trust >= 0) >= 40 then
    raise exception 'rate_limited_global' using errcode = 'P0429';
  end if;

  select s.name, s.approved into dup, dup_public
  from public.suggestions s
  where not s.hidden and s.status <> 'rejected' and (s.approved or s.author_id = auth.uid())
    and extensions.similarity(s.name_key, k) >= 0.8
  order by extensions.similarity(s.name_key, k) desc
  limit 1;
  if dup is not null then
    -- Name the existing game only when it is published: an unreviewed name may be junk.
    raise exception 'near_duplicate' using errcode = 'P0409', detail = case when dup_public then dup else '' end;
  end if;
  -- Shadow ban: the post "works" for its author but is born hidden.
  if exists (select 1 from public.profiles where id = auth.uid() and trust = -2) then new.hidden := true; end if;
  return new;
end;
$$;

-- "Already suggested?" hint: published suggestions only, signed-in fans only.
create or replace function public.search_similar(q text)
returns table (kind text, ref text, name text, status text, upvotes int)
language sql stable set search_path = public, extensions as $$
  with needle as (select lower(public.f_unaccent(q)) as n)
  select 'suggestion', s.id::text, s.name, s.status::text, s.upvotes
  from public.suggestions s, needle
  where s.approved and not s.hidden and (s.name_normalized % needle.n or s.name_normalized like '%' || needle.n || '%')
  union all
  select 'game', g.slug, g.name, coalesce(p.status::text, 'unknown'), 0
  from public.games g left join public.played_games p on p.game_slug = g.slug, needle
  where lower(public.f_unaccent(g.name)) % needle.n or lower(public.f_unaccent(g.name)) like '%' || needle.n || '%'
  limit 8;
$$;
revoke execute on function public.search_similar(text) from public, anon;
grant execute on function public.search_similar(text) to authenticated;

-- ===== Votes: aged accounts only, published suggestions only, 60 per hour =====
drop policy votes_insert_own on public.suggestion_votes;
create policy votes_insert_own on public.suggestion_votes for insert to authenticated
  with check (
    user_id = auth.uid() and not public.is_banned() and public.can_vote()
    and exists (select 1 from public.suggestions s where s.id = suggestion_id and s.approved and not s.hidden)
  );

create or replace function public.limit_votes_per_hour() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if;
  -- Shadow-banned: report success, store nothing.
  if exists (select 1 from public.profiles where id = auth.uid() and trust = -2) then return null; end if;
  perform pg_advisory_xact_lock(hashtext('votes:' || auth.uid()::text));
  if (select count(*) from public.suggestion_votes v
      where v.user_id = auth.uid() and v.created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
create trigger suggestion_votes_rate_limit
  before insert on public.suggestion_votes
  for each row execute function public.limit_votes_per_hour();

-- ===== Fan songs: same caps and bans =====
alter table public.fan_songs add constraint fan_songs_url_len check (char_length(url) <= 500);

drop policy fan_songs_insert on public.fan_songs;
create policy fan_songs_insert on public.fan_songs for insert to authenticated
  with check (author_id = auth.uid() and not approved and not public.is_banned());

create or replace function public.limit_fan_songs_per_day() returns trigger
language plpgsql security definer set search_path = '' as $$
declare today int;
begin
  new.title := public.strip_invisible(new.title);
  new.artist := public.strip_invisible(new.artist);
  new.note := nullif(public.strip_invisible(new.note), '');
  if auth.uid() is null then return new; end if;
  if char_length(new.title) < 2 or char_length(new.artist) < 1 then raise exception 'too_short' using errcode = 'P0422'; end if;
  perform pg_advisory_xact_lock(hashtext('fan_songs:' || auth.uid()::text));
  select count(*) into today from public.fan_songs s
  where s.author_id = auth.uid() and s.created_at > now() - interval '1 day';
  if today >= 3 then raise exception 'rate_limited' using errcode = 'P0429'; end if;
  if today >= 1 and public.account_is_new() then raise exception 'rate_limited_new' using errcode = 'P0429'; end if;
  perform pg_advisory_xact_lock(hashtext('fan_songs:global'));
  if (select count(*) from public.fan_songs s join public.profiles p on p.id = s.author_id
      where s.created_at > now() - interval '1 hour' and p.trust >= 0) >= 20 then
    raise exception 'rate_limited_global' using errcode = 'P0429';
  end if;
  return new;
end;
$$;

-- Nothing by a banned or shadow-banned author can be published, even by a mis-click.
create or replace function public.block_banned_approval() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.approved and not old.approved
     and exists (select 1 from public.profiles where id = new.author_id and trust < 0) then
    raise exception 'author_banned' using errcode = 'P0403';
  end if;
  return new;
end;
$$;
create trigger suggestions_block_banned_approval before update of approved on public.suggestions
  for each row execute function public.block_banned_approval();
create trigger fan_songs_block_banned_approval before update of approved on public.fan_songs
  for each row execute function public.block_banned_approval();

-- ===== Admin tools =====
-- One call to stop an abuser: sets trust, hides everything they posted, withdraws
-- their songs and votes, and resets their name. 'unban' only restores trust 0.
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
  delete from public.suggestion_votes where user_id = p_user;
  update public.profiles set display_name = 'Fan ' || left(p_user::text, 4) where id = p_user;
end;
$$;
revoke execute on function public.moderate_user(uuid, text) from public, anon;
grant execute on function public.moderate_user(uuid, text) to authenticated;

create or replace function public.reset_display_name(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.profiles set display_name = 'Fan ' || left(p_user::text, 4) where id = p_user;
end;
$$;
revoke execute on function public.reset_display_name(uuid) from public, anon;
grant execute on function public.reset_display_name(uuid) to authenticated;

revoke execute on function public.strip_invisible(text) from anon;
