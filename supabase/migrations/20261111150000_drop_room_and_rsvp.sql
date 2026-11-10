-- Removes the live reaction room and the "Tối nay tôi có mặt" RSVP (ADR-019): both cost
-- Realtime connections/messages per visitor, which does not fit the free plans once anh Độ's
-- audience (tens of thousands at once) shows up. Nothing else reads these objects.

-- ===== 1. "Tối nay tôi có mặt" =====
-- moderate_user no longer clears attendance rows (same body as 20261110200000 otherwise).
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
  update public.profiles set display_name = 'Fan ' || left(p_user::text, 4) where id = p_user;
  perform set_config('app.moderation_bulk', 'off', true);
end;
$$;
revoke execute on function public.moderate_user(uuid, text) from public, anon;
grant execute on function public.moderate_user(uuid, text) to authenticated;

drop function if exists public.attendance_count(date);
drop table if exists public.attendance; -- its trigger goes with it
drop function if exists public.drop_shadow_attendance();

-- ===== 2. The "tribe-room" Realtime channel (policies from 20261111090000) =====
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute 'drop policy if exists tribe_room_listen on realtime.messages';
    execute 'drop policy if exists tribe_room_presence on realtime.messages';
    execute 'drop policy if exists tribe_room_react on realtime.messages';
  end if;
end;
$$;
