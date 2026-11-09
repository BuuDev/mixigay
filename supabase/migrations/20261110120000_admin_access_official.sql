-- Private accounts (ADR-013, docs/03-data-model.md "Định danh"): nobody gives the site an
-- email, a phone number or a Google account — not fans, not anh Độ. An account is a
-- "tên Bộ Tộc" (login handle) + a passphrase. Auth users are created only by our
-- server (public sign-up is disabled in Supabase) with a synthetic, undeliverable
-- address that never leaves the server. anh Độ and admins join through a one-time
-- invite link and choose their own passphrase.

-- ===== Verified badge ("✓ Chính chủ") =====
alter table public.profiles add column verified boolean not null default false;
grant select (verified) on public.profiles to anon, authenticated; -- fans have no write grant on it

-- ===== Names reserved for verified accounts (impersonation) =====
create table public.reserved_name_terms (
  term text primary key check (term ~ '^[a-z0-9]+$')
);
alter table public.reserved_name_terms enable row level security;
create policy reserved_name_terms_admin on public.reserved_name_terms for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.reserved_name_terms from anon;

insert into public.reserved_name_terms (term) values
  ('domixi'), ('phungthanhdo'), ('mixigaming'), ('mixiofficial'), ('toctruong'),
  ('chinhchu'), ('admin'), ('quantrivien'), ('moderator');

-- Comparison key for names and handles: Cyrillic/Greek look-alikes folded to Latin,
-- diacritics removed, lower case, letters and digits only ("Dоmіxі" → "domixi").
create or replace function public.name_key(t text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select regexp_replace(lower(public.f_unaccent(translate(coalesce(t, ''),
    'аеорсухіјкмтвнѕАЕОРСУХІЈКМТВНЅοιαΟΙΑνκτ',
    'aeopcyxijkmtbhsaeopcyxijkmtbhsoiaoiavkt'))), '[^a-z0-9]', '', 'g');
$$;

-- Reserved-term check also folds digit swaps ("D0 M1x1").
create or replace function public.is_reserved_name(t text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.reserved_name_terms r
    where position(r.term in translate(public.name_key(t), '01345', 'oieas')) > 0
  );
$$;

create or replace function public.sanitize_display_name() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n text := public.strip_invisible(new.display_name);
  c text := public.name_key(n);
begin
  if c = ''
     or n ~* '(://|www\.|[a-z0-9-]{3,}\s*\.\s*(com|net|org|vn|xyz|club|win|bet|vip|top|site|live|me|io|co|cc)(\s|$))'
     or exists (select 1 from public.banned_terms b where position(b.term in c) > 0)
     or (not new.verified and public.is_reserved_name(n)) then
    n := 'Fan ' || left(new.id::text, 4);
  end if;
  new.display_name := left(n, 50);
  return new;
end;
$$;

drop trigger profiles_sanitize_name on public.profiles;
create trigger profiles_sanitize_name
  before insert or update of display_name, verified on public.profiles
  for each row execute function public.sanitize_display_name();

-- Re-check every existing name against the new rules (and after changing the term list).
update public.profiles set display_name = display_name;

-- ===== Site owner =====
-- Owners manage admins and invites; plain admins moderate content only.
alter table public.admins add column owner boolean not null default false;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and owner);
$$;

-- ===== Login handles (server-only) =====
-- handle_key → auth user. The synthetic auth email stays here and in auth.users only;
-- the API roles cannot read this table.
create table public.account_logins (
  handle_key text primary key check (handle_key ~ '^[a-z0-9]{3,24}$'),
  user_id uuid not null unique references auth.users on delete cascade,
  auth_email text not null unique,
  created_at timestamptz not null default now()
);
alter table public.account_logins enable row level security;
revoke all on public.account_logins from anon, authenticated;

-- ===== Rate limits for sign-up / sign-in / invite redemption (server-only) =====
create table public.auth_attempts (
  kind text not null check (kind in ('signup_ip', 'signup_all', 'login_handle', 'login_ip', 'invite_ip')),
  key text not null,
  at timestamptz not null default now()
);
create index auth_attempts_idx on public.auth_attempts (kind, key, at);
alter table public.auth_attempts enable row level security;
revoke all on public.auth_attempts from anon, authenticated;

-- true = allowed (and counted). Keys are hashed by the caller (no raw IPs stored).
create or replace function public.take_auth_attempt(p_kind text, p_key text, p_limit int, p_window interval) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('auth:' || p_kind || ':' || p_key));
  delete from public.auth_attempts where kind = p_kind and key = p_key and at < now() - p_window;
  if (select count(*) from public.auth_attempts where kind = p_kind and key = p_key) >= p_limit then
    return false;
  end if;
  insert into public.auth_attempts (kind, key) values (p_kind, p_key);
  return true;
end;
$$;

-- ===== One-time invites (anh Độ / channel team / admins) =====
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  role text not null check (role in ('owner', 'admin', 'official')),
  handle_key text not null check (handle_key ~ '^[a-z0-9]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 50),
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',
  used_at timestamptz,
  used_by uuid references auth.users on delete set null
);
alter table public.invites enable row level security;
revoke all on public.invites from anon, authenticated;

create or replace function public.token_hash(p_token text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
$$;

-- Returns the raw token ONCE; only its hash is stored. Owners issue 'admin' / 'official'
-- invites from /admin/quan-tri; the very first 'owner' invite is issued from the SQL
-- editor (auth.uid() is null there; the anon role cannot execute this function).
create or replace function public.issue_invite(p_role text, p_handle text, p_display text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  k text := public.name_key(p_handle);
  token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is not null and not public.is_owner() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_role = 'owner' and auth.uid() is not null then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_role not in ('owner', 'admin', 'official') then raise exception 'bad_role' using errcode = '22023'; end if;
  if k !~ '^[a-z0-9]{3,24}$' then raise exception 'bad_handle' using errcode = '22023'; end if;
  if exists (select 1 from public.account_logins where handle_key = k)
     or exists (select 1 from public.invites where handle_key = k and used_at is null and expires_at > now()) then
    raise exception 'handle_taken' using errcode = '23505';
  end if;
  insert into public.invites (token_hash, role, handle_key, display_name, created_by)
  values (public.token_hash(token), p_role, k, left(btrim(p_display), 50), auth.uid());
  return token;
end;
$$;

-- Server-only: what an unused, unexpired invite is for (to render /moi/<token>).
create or replace function public.peek_invite(p_token text)
returns table (role text, handle_key text, display_name text, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select i.role, i.handle_key, i.display_name, i.expires_at from public.invites i
  where i.token_hash = public.token_hash(p_token) and i.used_at is null and i.expires_at > now();
$$;

-- Server-only, called right after the server created the invited account.
create or replace function public.consume_invite(p_token text, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare inv public.invites;
begin
  select * into inv from public.invites
  where token_hash = public.token_hash(p_token) and used_at is null and expires_at > now()
  for update;
  if inv.id is null then raise exception 'invalid_invite' using errcode = 'P0403'; end if;
  update public.invites set used_at = now(), used_by = p_user where id = inv.id;
  insert into public.admins (user_id, owner) values (p_user, inv.role = 'owner')
    on conflict (user_id) do update set owner = public.admins.owner or excluded.owner;
  -- Badge first, then the name, so the reserved-name rule lets "Độ Mixi" through.
  update public.profiles set verified = (inv.role = 'official') where id = p_user;
  update public.profiles set display_name = inv.display_name where id = p_user;
end;
$$;

-- Owner view for /admin/quan-tri: admins by display name (no email anywhere) and open invites.
create or replace function public.list_access()
returns table (kind text, id uuid, display_name text, handle_key text, role text, at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select 'admin', a.user_id, p.display_name, l.handle_key,
           case when a.owner then 'owner' when p.verified then 'official' else 'admin' end, l.created_at
    from public.admins a join public.profiles p on p.id = a.user_id
    left join public.account_logins l on l.user_id = a.user_id
    union all
    select 'invite', i.id, i.display_name, i.handle_key, i.role, i.expires_at
    from public.invites i where i.used_at is null and i.expires_at > now()
    order by 1, 6;
end;
$$;

create or replace function public.revoke_invite(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.invites set expires_at = now() where id = p_id and used_at is null;
end;
$$;

-- Takes the admin role and the badge away (the sanitize trigger then resets a reserved
-- name). Owners are removed only from the SQL editor; nobody removes themselves.
create or replace function public.remove_admin(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'forbidden' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('admins'));
  if p_user = auth.uid() then raise exception 'cannot_remove_self' using errcode = 'P0403'; end if;
  if exists (select 1 from public.admins where user_id = p_user and owner) then raise exception 'cannot_remove_owner' using errcode = 'P0403'; end if;
  delete from public.admins where user_id = p_user;
  update public.profiles set verified = false where id = p_user;
end;
$$;

revoke execute on function public.take_auth_attempt(text, text, int, interval), public.peek_invite(text), public.consume_invite(text, uuid)
  from public, anon, authenticated;
revoke execute on function public.issue_invite(text, text, text), public.list_access(), public.revoke_invite(uuid), public.remove_admin(uuid)
  from public, anon;
grant execute on function public.issue_invite(text, text, text), public.list_access(), public.revoke_invite(uuid), public.remove_admin(uuid)
  to authenticated;

-- ===== Hardening after review =====
-- The email-based admin path from 20261109000000_init.sql is gone: no account has a
-- real address, and a confirmed-email trigger is exactly what an account that slipped
-- a real address in could abuse.
drop trigger if exists on_admin_email_added on public.admin_emails;
drop trigger if exists on_auth_user_confirmed on auth.users;
drop function if exists public.grant_admin_for_email();
drop function if exists public.handle_email_confirmed();
drop table if exists public.admin_emails;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), 'Fan'), 50),
    null
  );
  return new;
end;
$$;
drop function if exists public.grant_admin_if_listed(uuid, text, timestamptz);

-- A signed-in user could otherwise call the Auth API (PUT /auth/v1/user) to swap the
-- synthetic address for a real one and then use /recover or /otp with it.
create or replace function public.keep_synthetic_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email and coalesce(new.email, '') !~ '^u-[0-9a-f-]{36}@id\.gocbotoc\.invalid$' then
    raise exception 'email_change_not_allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger auth_users_keep_synthetic_email
  before update of email on auth.users
  for each row execute function public.keep_synthetic_email();

-- Failed sign-ins only: counting every attempt would let a stranger keep someone's
-- handle locked by guessing on purpose.
create or replace function public.auth_attempts_exceeded(p_kind text, p_key text, p_limit int, p_window interval) returns boolean
language sql stable security definer set search_path = '' as $$
  select count(*) >= p_limit from public.auth_attempts where kind = p_kind and key = p_key and at > now() - p_window;
$$;
create or replace function public.note_auth_failure(p_kind text, p_key text) returns void
language sql security definer set search_path = '' as $$
  insert into public.auth_attempts (kind, key) values (p_kind, p_key);
$$;
alter table public.auth_attempts drop constraint auth_attempts_kind_check;
alter table public.auth_attempts add constraint auth_attempts_kind_check
  check (kind in ('signup_ip', 'signup_all', 'login_handle', 'login_handle_ip', 'login_ip', 'invite_ip'));

-- Server-only helpers must not be callable through the API.
revoke execute on function public.is_reserved_name(text), public.auth_attempts_exceeded(text, text, int, interval), public.note_auth_failure(text, text),
  public.keep_synthetic_email() from public, anon, authenticated;
