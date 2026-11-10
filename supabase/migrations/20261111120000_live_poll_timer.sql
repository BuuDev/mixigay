-- Live polling on a timer instead of every minute (ADR-018, docs/02-architecture.md flow 1).
-- poll-live stores when it next needs to look; pg_cron still ticks every minute but only
-- calls the app when public.poll_live_due() says so, so quiet hours cost no Vercel call,
-- no YouTube unit and no Realtime message.
--
-- The bookkeeping lives in its own table, outside the supabase_realtime publication:
-- writing checked_at into live_status pushed one Realtime message to every open tab on
-- every check, even when nothing had changed.

create table public.live_poll_state (
  id boolean primary key default true check (id),
  checked_at timestamptz,
  next_check_at timestamptz not null default now(),
  reason text
);
insert into public.live_poll_state (id) values (true);

alter table public.live_poll_state enable row level security;
-- Admins read it on /admin; only the service role (poll-live, WebSub) writes it.
create policy live_poll_state_admin_read on public.live_poll_state for select to authenticated using (public.is_admin());
revoke all on public.live_poll_state from anon, authenticated;
grant select on public.live_poll_state to authenticated;

update public.live_poll_state p set checked_at = s.checked_at from public.live_status s where s.id;

-- pg_cron (supabase/cron.sql) asks this every minute before calling /api/cron/poll-live.
create or replace function public.poll_live_due() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.next_check_at <= now() from public.live_poll_state p where p.id), true);
$$;
revoke execute on function public.poll_live_due() from public, anon, authenticated;

-- Any change to the schedule wakes poll-live on the next tick, so a moved, added or
-- cancelled stream is planned around right away instead of after the old timer.
-- Row-level on purpose: a statement-level trigger also fires for an UPDATE/DELETE that
-- RLS filtered down to zero rows, so anyone with the anon key could keep the timer due
-- every minute. Per row, only writes RLS actually let through (admins) wake it.
create or replace function public.wake_live_poll() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.live_poll_state set next_check_at = now(), reason = 'schedule_changed'
  where id and next_check_at > now();
  return null;
end;
$$;
revoke execute on function public.wake_live_poll() from public, anon, authenticated;

create trigger schedule_slots_wake_live_poll after insert or update or delete on public.schedule_slots
  for each row execute function public.wake_live_poll();
create trigger schedule_overrides_wake_live_poll after insert or update or delete on public.schedule_overrides
  for each row execute function public.wake_live_poll();
