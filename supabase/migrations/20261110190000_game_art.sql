-- Game art served from our own Storage: Steam header images mirrored once, and
-- thumbnails fans upload for fan-made / non-Steam games. docs/03-data-model.md
-- "Ảnh game (game-art)". Every image is sanitised server-side (sharp re-encode, no
-- metadata) and written with the service role; fans never write Storage directly.

-- thumbnail_path: object path inside the game-art bucket. It does not join the fan
-- insert grant (name, source, url, reason), so only the service role (and admins,
-- through the existing admin update policy) can set it.
alter table public.suggestions
  add column thumbnail_path text check (thumbnail_path is null or thumbnail_path ~ '^suggestions/[0-9a-f-]{36}\.webp$');

-- The server's verdict on that image ({verdict, reasons[], sha256, originalSha256, source}).
-- Its own table, not a suggestions column: suggestions has a table-wide public select
-- grant, so a column there would be readable by anyone through the API. Admin read only;
-- the service role writes it.
create table public.suggestion_art_reviews (
  suggestion_id uuid primary key references public.suggestions on delete cascade,
  review jsonb not null check (jsonb_typeof(review) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.suggestion_art_reviews enable row level security;
revoke all on public.suggestion_art_reviews from anon, authenticated;
grant select on public.suggestion_art_reviews to authenticated; -- admins only (policy)
create policy suggestion_art_reviews_admin_read on public.suggestion_art_reviews for select to authenticated using (public.is_admin());

-- Images an admin removed and banned for good: an identical re-upload is refused.
create table public.banned_image_hashes (
  sha256 text primary key check (sha256 ~ '^[0-9a-f]{64}$'),
  reason text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.profiles on delete set null
);
alter table public.banned_image_hashes enable row level security;
revoke all on public.banned_image_hashes from anon, authenticated;
grant select, insert, delete on public.banned_image_hashes to authenticated; -- admins only (policies)
create policy banned_image_hashes_admin_read on public.banned_image_hashes for select to authenticated using (public.is_admin());
create policy banned_image_hashes_admin_insert on public.banned_image_hashes for insert to authenticated with check (public.is_admin());
create policy banned_image_hashes_admin_delete on public.banned_image_hashes for delete to authenticated using (public.is_admin());

-- Public bucket (read by URL), 1 MB, WebP only. No storage.objects policies for anon or
-- authenticated: only the service role, which bypasses RLS, uploads or deletes.
-- Guarded so the PGlite check (no storage schema) still applies this migration.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    execute $sql$
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('game-art', 'game-art', true, 1048576, array['image/webp'])
      on conflict (id) do update
        set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types
    $sql$;
  end if;
end;
$$;
