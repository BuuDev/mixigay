-- "Nhạc nịnh" board: fan-made songs about the channel, linked (never hosted or
-- embedded) and published only after an admin approves them. docs/03-data-model.md

create table public.fan_songs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  artist text not null check (char_length(artist) between 1 and 80),
  -- Links only to known music/video platforms (also checked in the app).
  url text not null check (url ~* '^https://(www\.|m\.)?(youtube\.com|youtu\.be|soundcloud\.com|on\.soundcloud\.com|tiktok\.com|vt\.tiktok\.com|open\.spotify\.com|zingmp3\.vn|nhaccuatui\.com)/.+'),
  note text check (note is null or char_length(note) <= 300),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index fan_songs_public_idx on public.fan_songs (approved, created_at desc);
-- Unique among published songs only: a pending copy cannot block the real author,
-- and approving a second copy of a published link fails for the admin to resolve.
create unique index fan_songs_url_uniq on public.fan_songs (lower(url)) where approved;

alter table public.fan_songs enable row level security;

-- Fans write only their four text columns; approval is the admin's.
revoke insert, update on public.fan_songs from anon, authenticated;
grant insert (title, artist, url, note) on public.fan_songs to authenticated;
grant update on public.fan_songs to authenticated; -- admins only, via fan_songs_admin_update

create policy fan_songs_read on public.fan_songs for select
  using (approved or author_id = auth.uid() or public.is_admin());
create policy fan_songs_insert on public.fan_songs for insert to authenticated
  with check (author_id = auth.uid() and not approved);
create policy fan_songs_admin_update on public.fan_songs for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Admin-only: if authors could delete pending rows, insert→delete loops would
-- reset the daily limit (the trigger counts existing rows).
create policy fan_songs_admin_delete on public.fan_songs for delete to authenticated
  using (public.is_admin());

-- At most 3 submissions per user per day, serialized per user (no race).
create or replace function public.limit_fan_songs_per_day() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if;
  perform pg_advisory_xact_lock(hashtext('fan_songs:' || auth.uid()::text));
  if (select count(*) from public.fan_songs s
      where s.author_id = auth.uid() and s.created_at > now() - interval '1 day') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0429';
  end if;
  return new;
end;
$$;

create trigger fan_songs_rate_limit
  before insert on public.fan_songs
  for each row execute function public.limit_fan_songs_per_day();
