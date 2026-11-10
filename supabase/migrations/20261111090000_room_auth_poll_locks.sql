-- Hardening after review (rls-auditor):
-- 1. The "Bộ Tộc đang ở đây" room becomes a PRIVATE Realtime channel. Before, anyone with
--    the public anon key could broadcast reactions at full speed into a public channel and
--    burn the project's Realtime message budget (which also carries poll counts and
--    live_status). Now: anon + authenticated may listen and be counted (presence);
--    only signed-in, non-banned fans may broadcast. docs/04-integrations.md "Supabase Realtime".
-- 2. A vote and a ban of the same user racing each other could leave the banned user's vote
--    counted. Both paths now serialise on the same per-user lock, and the vote re-reads
--    trust after taking it.

-- ===== 1. Realtime authorization (only where the realtime schema exists; PGlite has none) =====
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute $sql$
      create policy tribe_room_listen on realtime.messages for select to anon, authenticated
        using (realtime.topic() = 'tribe-room' and extension in ('broadcast', 'presence'))
    $sql$;
    execute $sql$
      create policy tribe_room_presence on realtime.messages for insert to anon, authenticated
        with check (realtime.topic() = 'tribe-room' and extension = 'presence')
    $sql$;
    execute $sql$
      create policy tribe_room_react on realtime.messages for insert to authenticated
        with check (realtime.topic() = 'tribe-room' and extension = 'broadcast' and not public.is_banned())
    $sql$;
  end if;
end;
$$;

-- ===== 2. Votes vs bans: one per-user lock for both =====
create or replace function public.limit_poll_votes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_trust smallint;
begin
  if auth.uid() is null then return new; end if; -- service role / admin tooling
  if tg_op = 'UPDATE' and new.option_id = old.option_id then return new; end if;
  -- Same lock as withdraw_poll_votes_on_ban: a ban committing meanwhile is seen below.
  perform pg_advisory_xact_lock(hashtext('poll_votes:' || auth.uid()::text));
  select p.trust into v_trust from public.profiles p where p.id = auth.uid();
  if v_trust = -1 then raise exception 'banned' using errcode = '42501'; end if;
  -- Shadow-banned: report success, store nothing (returning null skips the insert/update).
  if v_trust = -2 then return null; end if;
  delete from public.poll_vote_events e where e.user_id = auth.uid() and e.at <= now() - interval '1 hour';
  if (select count(*) from public.poll_vote_events e where e.user_id = auth.uid()) >= 60 then
    raise exception 'rate_limited' using errcode = 'P0429';
  end if;
  insert into public.poll_vote_events (user_id) values (auth.uid());
  return new;
end;
$$;
revoke execute on function public.limit_poll_votes() from public, anon, authenticated;

create or replace function public.withdraw_poll_votes_on_ban() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.trust < 0 and old.trust >= 0 then
    perform pg_advisory_xact_lock(hashtext('poll_votes:' || new.id::text));
    delete from public.poll_votes where user_id = new.id;
  end if;
  return null;
end;
$$;
revoke execute on function public.withdraw_poll_votes_on_ban() from public, anon, authenticated;
