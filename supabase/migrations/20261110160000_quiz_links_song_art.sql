-- 1. Fan songs get a cover (thumbnail) image taken from the platform's own oEmbed.
-- 2. "Đố vui" becomes a board of quiz LINKS that fans made on Kahoot / Wayground /
--    Wordwall / Google Forms… for anh Độ to play on stream. The site no longer hosts
--    its own questions, so quiz_questions is dropped (it only ever held dev data).
-- docs/03-data-model.md "Ảnh bìa bài nhạc" and "quiz_links".

-- ===== 1. Song covers =====
-- Hosts are pinned: the browser loads this image, so a fan must not be able to point
-- it at an arbitrary server (tracking pixel, shock image). TikTok CDN links expire,
-- so TikTok songs simply have no cover.
alter table public.fan_songs
  add column thumbnail_url text check (
    thumbnail_url is null
    or (char_length(thumbnail_url) <= 500
        and thumbnail_url ~ '^https://(i[0-9]\.sndcdn\.com|i\.ytimg\.com|i\.scdn\.co|image-cdn-[a-z]{2}\.spotifycdn\.com)/[^\s]+$')
  );
grant insert (thumbnail_url) on public.fan_songs to authenticated;

-- ===== 2. Quiz links =====
drop table public.quiz_questions;
drop function public.limit_quiz_questions_per_day();

create table public.quiz_links (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  -- Only quiz platforms: a link-sharing board would otherwise become an ad board.
  url text not null check (
    char_length(url) <= 300
    and url ~* '^https://((www\.|create\.|play\.)?(kahoot\.it|quizizz\.com|wayground\.com|wordwall\.net|quizlet\.com|blooket\.com)|forms\.gle|docs\.google\.com/forms)/[^\s]+$'
  ),
  description text check (description is null or char_length(description) <= 300),
  -- Set by admins once anh Độ played it: the stream moment, linked with ?t=.
  played_video_id text references public.videos on delete set null,
  played_at_seconds int check (played_at_seconds is null or played_at_seconds between 0 and 86400),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index quiz_links_url_key on public.quiz_links (lower(url));
create index quiz_links_public_idx on public.quiz_links (approved, created_at desc);

alter table public.quiz_links enable row level security;
revoke all on public.quiz_links from anon, authenticated;
grant select on public.quiz_links to anon, authenticated;
grant insert (title, url, description) on public.quiz_links to authenticated;
grant update, delete on public.quiz_links to authenticated; -- admins only (policies)
create policy quiz_links_read on public.quiz_links for select using (approved or author_id = auth.uid() or public.is_admin());
create policy quiz_links_insert on public.quiz_links for insert to authenticated
  with check (author_id = auth.uid() and not approved and not public.is_banned());
create policy quiz_links_admin_update on public.quiz_links for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy quiz_links_admin_delete on public.quiz_links for delete to authenticated using (public.is_admin());

create or replace function public.limit_quiz_links() returns trigger
language plpgsql security definer set search_path = '' as $$
declare today int;
begin
  new.title := public.strip_invisible(new.title);
  new.description := nullif(public.strip_invisible(new.description), '');
  if auth.uid() is null then return new; end if;
  if char_length(new.title) < 5 then raise exception 'too_short' using errcode = 'P0422'; end if;
  perform pg_advisory_xact_lock(hashtext('quiz_links:' || auth.uid()::text));
  select count(*) into today from public.quiz_links l where l.author_id = auth.uid() and l.created_at > now() - interval '1 day';
  if today >= 3 then raise exception 'rate_limited' using errcode = 'P0429'; end if;
  if today >= 1 and public.account_is_new() then raise exception 'rate_limited_new' using errcode = 'P0429'; end if;
  return new;
end;
$$;
revoke execute on function public.limit_quiz_links() from public, anon, authenticated;
create trigger quiz_links_rate_limit before insert on public.quiz_links for each row execute function public.limit_quiz_links();
create trigger quiz_links_block_banned_approval before update of approved on public.quiz_links
  for each row execute function public.block_banned_approval();

-- ===== Moderation and reports follow the new table =====
create or replace function public.moderate_user(p_user uuid, p_mode text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_mode not in ('ban', 'shadow', 'unban') then raise exception 'bad_mode' using errcode = '22023'; end if;
  update public.profiles
    set trust = case p_mode when 'ban' then -1 when 'shadow' then -2 else 0 end
    where id = p_user;
  if p_mode = 'unban' then return; end if;
  -- Everything the user ever published goes back behind moderation.
  update public.suggestions set hidden = true where author_id = p_user;
  update public.fan_songs set approved = false where author_id = p_user;
  update public.wall_messages set approved = false where author_id = p_user;
  update public.quotes set approved = false where author_id = p_user;
  update public.glossary_entries set approved = false where author_id = p_user;
  update public.fan_art set approved = false where author_id = p_user;
  update public.quiz_links set approved = false where author_id = p_user;
  delete from public.suggestion_votes where user_id = p_user;
  delete from public.fan_song_votes where user_id = p_user;
  delete from public.attendance where user_id = p_user;
  update public.profiles set display_name = 'Fan ' || left(p_user::text, 4) where id = p_user;
end;
$$;

alter table public.reports drop constraint reports_target_kind_check;
alter table public.reports add constraint reports_target_kind_check
  check (target_kind in ('suggestion', 'fan_song', 'profile', 'wall_message', 'quote', 'glossary_entry', 'quiz_link'));

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
  elsif new.target_kind = 'quote' then
    found_target := exists (select 1 from public.quotes q where q.id = new.target_id and q.approved);
  elsif new.target_kind = 'glossary_entry' then
    found_target := exists (select 1 from public.glossary_entries g where g.id = new.target_id and g.approved);
  elsif new.target_kind = 'quiz_link' then
    found_target := exists (select 1 from public.quiz_links l where l.id = new.target_id and l.approved);
  else
    found_target := exists (select 1 from public.profiles p where p.id = new.target_id);
  end if;
  if not found_target then
    raise exception 'not_found' using errcode = 'P0404';
  end if;
  return new;
end;
$$;
