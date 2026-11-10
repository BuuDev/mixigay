-- Fan art via personal Google Drive share links + Fan-contributed Quiz questions.
-- Zero server file storage: images live on the fan's own Google Drive ("Anyone with the link can view").
-- Reference: docs/03-data-model.md

-- ===== 1. Fan art (Google Drive share links) =====
create table public.fan_art (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 120),
  artist text not null check (char_length(btrim(artist)) between 1 and 80),
  drive_url text not null check (
    char_length(drive_url) <= 500
    and drive_url ~* '^https://(drive\.google\.com|docs\.google\.com)/[A-Za-z0-9_/?=&.-]+$'
  ),
  drive_file_id text not null check (char_length(drive_file_id) between 10 and 80 and drive_file_id ~ '^[A-Za-z0-9_-]+$'),
  note text check (note is null or char_length(note) <= 300),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Only one published copy per Google Drive file id; pending rows do not reserve the id.
create unique index fan_art_drive_file_uniq on public.fan_art (drive_file_id) where approved;
create index fan_art_approved_idx on public.fan_art (created_at desc) where approved;
create index fan_art_author_idx on public.fan_art (author_id, created_at desc);

alter table public.fan_art enable row level security;

create policy fan_art_read on public.fan_art for select
  using (approved or author_id = auth.uid() or public.is_admin());

revoke insert, update on public.fan_art from anon, authenticated;
grant insert (title, artist, drive_url, drive_file_id, note) on public.fan_art to authenticated;
grant update on public.fan_art to authenticated; -- admins only, via fan_art_admin_update

create policy fan_art_insert on public.fan_art for insert to authenticated
  with check (author_id = auth.uid() and not approved and not public.is_banned());

create policy fan_art_admin_update on public.fan_art for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy fan_art_admin_delete on public.fan_art for delete to authenticated
  using (public.is_admin());

create or replace function public.limit_fan_art_per_day() returns trigger
language plpgsql security definer set search_path = '' as $$
declare today int;
begin
  new.title := public.strip_invisible(new.title);
  new.artist := public.strip_invisible(new.artist);
  new.note := nullif(public.strip_invisible(new.note), '');
  if auth.uid() is null then return new; end if;
  if char_length(new.title) < 2 or char_length(new.artist) < 1 then raise exception 'too_short' using errcode = 'P0422'; end if;
  perform pg_advisory_xact_lock(hashtext('fan_art:' || auth.uid()::text));
  select count(*) into today from public.fan_art a
  where a.author_id = auth.uid() and a.created_at > now() - interval '1 day';
  if today >= 3 then raise exception 'rate_limited' using errcode = 'P0429'; end if;
  if today >= 1 and public.account_is_new() then raise exception 'rate_limited_new' using errcode = 'P0429'; end if;
  perform pg_advisory_xact_lock(hashtext('fan_art:global'));
  if (select count(*) from public.fan_art a join public.profiles p on p.id = a.author_id
      where a.created_at > now() - interval '1 hour' and p.trust >= 0) >= 20 then
    raise exception 'rate_limited_global' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_fan_art_per_day() from public, anon, authenticated;

create trigger fan_art_rate_limit
  before insert on public.fan_art
  for each row execute function public.limit_fan_art_per_day();

create trigger fan_art_block_banned_approval
  before update of approved on public.fan_art
  for each row execute function public.block_banned_approval();


-- ===== 2. Fan-contributed Quiz questions =====
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  question text not null check (char_length(btrim(question)) between 10 and 240),
  option_a text not null check (char_length(btrim(option_a)) between 1 and 120),
  option_b text not null check (char_length(btrim(option_b)) between 1 and 120),
  option_c text not null check (char_length(btrim(option_c)) between 1 and 120),
  option_d text not null check (char_length(btrim(option_d)) between 1 and 120),
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation text check (explanation is null or char_length(explanation) <= 300),
  author_name text not null default 'Bộ Tộc' check (char_length(btrim(author_name)) between 1 and 60),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index quiz_questions_approved_idx on public.quiz_questions (created_at desc) where approved;
create index quiz_questions_author_idx on public.quiz_questions (author_id, created_at desc);

alter table public.quiz_questions enable row level security;

create policy quiz_questions_read on public.quiz_questions for select
  using (approved or author_id = auth.uid() or public.is_admin());

revoke insert, update on public.quiz_questions from anon, authenticated;
grant insert (question, option_a, option_b, option_c, option_d, correct_index, explanation, author_name) on public.quiz_questions to authenticated;
grant update on public.quiz_questions to authenticated; -- admins only, via quiz_questions_admin_update

create policy quiz_questions_insert on public.quiz_questions for insert to authenticated
  with check (author_id = auth.uid() and not approved and not public.is_banned());

create policy quiz_questions_admin_update on public.quiz_questions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy quiz_questions_admin_delete on public.quiz_questions for delete to authenticated
  using (public.is_admin());

create or replace function public.limit_quiz_questions_per_day() returns trigger
language plpgsql security definer set search_path = '' as $$
declare today int;
begin
  new.question := public.strip_invisible(new.question);
  new.option_a := public.strip_invisible(new.option_a);
  new.option_b := public.strip_invisible(new.option_b);
  new.option_c := public.strip_invisible(new.option_c);
  new.option_d := public.strip_invisible(new.option_d);
  new.explanation := nullif(public.strip_invisible(new.explanation), '');
  new.author_name := coalesce(nullif(public.strip_invisible(new.author_name), ''), 'Bộ Tộc');
  if auth.uid() is null then return new; end if;
  if char_length(new.question) < 10
     or char_length(new.option_a) < 1
     or char_length(new.option_b) < 1
     or char_length(new.option_c) < 1
     or char_length(new.option_d) < 1 then
    raise exception 'too_short' using errcode = 'P0422';
  end if;
  perform pg_advisory_xact_lock(hashtext('quiz_questions:' || auth.uid()::text));
  select count(*) into today from public.quiz_questions q
  where q.author_id = auth.uid() and q.created_at > now() - interval '1 day';
  if today >= 3 then raise exception 'rate_limited' using errcode = 'P0429'; end if;
  if today >= 1 and public.account_is_new() then raise exception 'rate_limited_new' using errcode = 'P0429'; end if;
  perform pg_advisory_xact_lock(hashtext('quiz_questions:global'));
  if (select count(*) from public.quiz_questions q join public.profiles p on p.id = q.author_id
      where q.created_at > now() - interval '1 hour' and p.trust >= 0) >= 20 then
    raise exception 'rate_limited_global' using errcode = 'P0429';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_quiz_questions_per_day() from public, anon, authenticated;

create trigger quiz_questions_rate_limit
  before insert on public.quiz_questions
  for each row execute function public.limit_quiz_questions_per_day();

create trigger quiz_questions_block_banned_approval
  before update of approved on public.quiz_questions
  for each row execute function public.block_banned_approval();


-- ===== 3. Extend moderate_user so banning also unpublishes fan_art and quiz_questions =====
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
  update public.profiles set display_name = 'Fan ' || left(p_user::text, 4) where id = p_user;
end;
$$;
revoke execute on function public.moderate_user(uuid, text) from public, anon;
grant execute on function public.moderate_user(uuid, text) to authenticated;
