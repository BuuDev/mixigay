-- Moderation center: "reject" instead of delete, an audit log of every moderation
-- decision, and an admin-managed list of blocked terms. docs/03-data-model.md
-- "Trung tâm kiểm duyệt (20261110200000)".
--
-- Why reject instead of delete: the per-day rate limits count existing rows, so a
-- deleted spam row gave the spammer their quota back. A rejected row stays, hidden
-- from everyone but its author and admins, and keeps counting.
--
-- "Pending" from now on means: approved = false and rejected_at is null
-- (suggestions: and hidden = false).

-- ===== 1. rejected_at / rejected_reason on the 7 fan-content tables =====
-- None of them is added to a fan insert grant. Every table already grants a
-- table-wide UPDATE to authenticated, restricted to admins by its *_admin_update
-- policy, so admins can set the new columns without further grants.
do $$
declare t text;
begin
  foreach t in array array['suggestions', 'fan_songs', 'fan_art', 'quiz_links', 'quotes', 'glossary_entries', 'wall_messages'] loop
    execute format(
      'alter table public.%1$I
         add column rejected_at timestamptz,
         add column rejected_reason text check (rejected_reason is null or char_length(rejected_reason) <= 300),
         add constraint %1$s_rejected_not_approved check (rejected_at is null or not approved)',
      t
    );
  end loop;
end;
$$;

-- Approving clears an earlier rejection; rejecting always unpublishes.
create or replace function public.clear_rejection_on_approve() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.rejected_at is not null and old.rejected_at is null then
    -- A new rejection wins over an approval in the same statement.
    new.approved := false;
  elsif new.approved and not old.approved then
    new.rejected_at := null;
    new.rejected_reason := null;
  elsif new.rejected_at is not null then
    new.approved := false;
  end if;
  return new;
end;
$$;
revoke execute on function public.clear_rejection_on_approve() from public, anon, authenticated;

create trigger suggestions_clear_rejection before update on public.suggestions
  for each row execute function public.clear_rejection_on_approve();
create trigger fan_songs_clear_rejection before update on public.fan_songs
  for each row execute function public.clear_rejection_on_approve();
create trigger fan_art_clear_rejection before update on public.fan_art
  for each row execute function public.clear_rejection_on_approve();
create trigger quiz_links_clear_rejection before update on public.quiz_links
  for each row execute function public.clear_rejection_on_approve();
create trigger quotes_clear_rejection before update on public.quotes
  for each row execute function public.clear_rejection_on_approve();
create trigger glossary_entries_clear_rejection before update on public.glossary_entries
  for each row execute function public.clear_rejection_on_approve();
create trigger wall_messages_clear_rejection before update on public.wall_messages
  for each row execute function public.clear_rejection_on_approve();

-- Pending queues.
create index suggestions_pending_idx on public.suggestions (created_at desc) where not approved and rejected_at is null and not hidden;
create index fan_songs_pending_idx on public.fan_songs (created_at desc) where not approved and rejected_at is null;
create index fan_art_pending_idx on public.fan_art (created_at desc) where not approved and rejected_at is null;
create index quiz_links_pending_idx on public.quiz_links (created_at desc) where not approved and rejected_at is null;
create index quotes_pending_idx on public.quotes (created_at desc) where not approved and rejected_at is null;
create index glossary_entries_pending_idx on public.glossary_entries (created_at desc) where not approved and rejected_at is null;
create index wall_messages_pending_idx on public.wall_messages (created_at desc) where not approved and rejected_at is null;

-- ===== 2. Moderation log =====
create table public.moderation_log (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('suggestion', 'fan_song', 'fan_art', 'quiz_link', 'quote', 'glossary_entry', 'wall_message', 'profile')),
  target_id uuid not null,
  author_id uuid references public.profiles on delete set null,
  actor_id uuid references public.profiles on delete set null,
  action text not null check (action in ('approve', 'unapprove', 'reject', 'delete', 'ban', 'shadow', 'unban')),
  reason text check (reason is null or char_length(reason) <= 300),
  snapshot text check (snapshot is null or char_length(snapshot) <= 200),
  created_at timestamptz not null default now()
);
create index moderation_log_created_idx on public.moderation_log (created_at desc);
create index moderation_log_author_idx on public.moderation_log (author_id, created_at desc);
create index moderation_log_target_idx on public.moderation_log (target_id);

alter table public.moderation_log enable row level security;
-- Rows come only from the security-definer trigger and moderate_user below.
revoke all on public.moderation_log from anon, authenticated;
grant select on public.moderation_log to authenticated; -- admins only (policy)
create policy moderation_log_admin_read on public.moderation_log for select to authenticated using (public.is_admin());

-- TG_ARGV[0] = kind, TG_ARGV[1] = the column copied into snapshot.
create or replace function public.log_content_moderation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_action text;
  v_reason text;
  v_row jsonb;
  v_author uuid;
begin
  if coalesce(current_setting('app.moderation_bulk', true), '') = 'on' then
    return null;
  end if;

  if tg_op = 'DELETE' then
    v_action := 'delete';
    v_row := to_jsonb(old);
    v_author := old.author_id;
    -- Rows removed because their author's account was deleted (cascade) are not a
    -- moderation decision, and the author_id would no longer satisfy the FK.
    if not exists (select 1 from public.profiles p where p.id = v_author) then
      return null;
    end if;
  else
    v_row := to_jsonb(new);
    v_author := new.author_id;
    if old.rejected_at is null and new.rejected_at is not null then
      v_action := 'reject';
      v_reason := new.rejected_reason;
    elsif new.approved and not old.approved then
      v_action := 'approve';
    elsif old.approved and not new.approved then
      v_action := 'unapprove';
    else
      return null;
    end if;
  end if;

  insert into public.moderation_log (kind, target_id, author_id, actor_id, action, reason, snapshot)
  values (
    tg_argv[0],
    (v_row ->> 'id')::uuid,
    (select p.id from public.profiles p where p.id = v_author),
    (select p.id from public.profiles p where p.id = auth.uid()),
    v_action,
    v_reason,
    left(v_row ->> tg_argv[1], 200)
  );
  return null;
end;
$$;
revoke execute on function public.log_content_moderation() from public, anon, authenticated;

create trigger suggestions_log_moderation after update of approved, rejected_at or delete on public.suggestions
  for each row execute function public.log_content_moderation('suggestion', 'name');
create trigger fan_songs_log_moderation after update of approved, rejected_at or delete on public.fan_songs
  for each row execute function public.log_content_moderation('fan_song', 'title');
create trigger fan_art_log_moderation after update of approved, rejected_at or delete on public.fan_art
  for each row execute function public.log_content_moderation('fan_art', 'title');
create trigger quiz_links_log_moderation after update of approved, rejected_at or delete on public.quiz_links
  for each row execute function public.log_content_moderation('quiz_link', 'title');
create trigger quotes_log_moderation after update of approved, rejected_at or delete on public.quotes
  for each row execute function public.log_content_moderation('quote', 'body');
create trigger glossary_entries_log_moderation after update of approved, rejected_at or delete on public.glossary_entries
  for each row execute function public.log_content_moderation('glossary_entry', 'term');
create trigger wall_messages_log_moderation after update of approved, rejected_at or delete on public.wall_messages
  for each row execute function public.log_content_moderation('wall_message', 'body');

-- ===== 3. moderate_user: same behaviour, one log row instead of hundreds =====
create or replace function public.moderate_user(p_user uuid, p_mode text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_mode not in ('ban', 'shadow', 'unban') then raise exception 'bad_mode' using errcode = '22023'; end if;
  -- One 'profile' row for the decision; the per-content triggers stay quiet below.
  insert into public.moderation_log (kind, target_id, author_id, actor_id, action)
  select 'profile', p_user, p.id, (select a.id from public.profiles a where a.id = auth.uid()), p_mode
  from public.profiles p where p.id = p_user;
  update public.profiles
    set trust = case p_mode when 'ban' then -1 when 'shadow' then -2 else 0 end
    where id = p_user;
  if p_mode = 'unban' then return; end if;
  perform set_config('app.moderation_bulk', 'on', true);
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
  perform set_config('app.moderation_bulk', 'off', true);
end;
$$;
revoke execute on function public.moderate_user(uuid, text) from public, anon;
grant execute on function public.moderate_user(uuid, text) to authenticated;

-- ===== 4. Blocked terms (admin-managed text filter) =====
-- Read by the app server with the service role. Not public: spammers must not be
-- able to read the list and write around it.
create table public.blocked_terms (
  term text primary key check (term = lower(term) and char_length(term) between 2 and 60),
  category text not null check (category in ('gambling', 'profanity', 'spam')),
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
alter table public.blocked_terms enable row level security;
revoke all on public.blocked_terms from anon, authenticated;
grant select, insert, delete on public.blocked_terms to authenticated; -- admins only (policies)
create policy blocked_terms_admin_read on public.blocked_terms for select to authenticated using (public.is_admin());
create policy blocked_terms_admin_insert on public.blocked_terms for insert to authenticated with check (public.is_admin());
create policy blocked_terms_admin_delete on public.blocked_terms for delete to authenticated using (public.is_admin());
