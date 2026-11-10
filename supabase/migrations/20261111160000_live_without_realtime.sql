-- Free-plan live status (ADR-019): nothing on the site uses Supabase Realtime any more.
-- Browsers read the live state from a CDN-cached JSON (/api/live) at the moment the
-- server plans its next check, so tens of thousands of open tabs hold no connection and
-- each scheduled check reaches the server once per CDN window, not once per tab.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'live_status') then
      alter publication supabase_realtime drop table public.live_status;
    end if;
    if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'poll_options') then
      alter publication supabase_realtime drop table public.poll_options;
    end if;
  end if;
end;
$$;

-- When poll-live will look next: public, so browsers can sleep until then. Only the time;
-- the reason and the last check stay admin-only in live_poll_state.
create or replace function public.live_next_check_at() returns timestamptz
language sql stable security definer set search_path = '' as $$
  select p.next_check_at from public.live_poll_state p where p.id;
$$;
revoke execute on function public.live_next_check_at() from public;
grant execute on function public.live_next_check_at() to anon, authenticated;
