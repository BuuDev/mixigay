-- Production only: run once in the Supabase SQL editor after the app is deployed.
-- Not a migration, so `supabase db reset` locally does not start polling.
--
-- 1. Store the app URL and CRON_SECRET in Vault (never inline in SQL that is committed):
--      select vault.create_secret('https://<your-domain>', 'app_url');
--      select vault.create_secret('<CRON_SECRET value>', 'cron_secret');
-- 2. Run the rest of this file.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.call_cron_route(path text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url') || path,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;
revoke execute on function public.call_cron_route(text) from public, anon, authenticated;

-- The route decides between 1- and 5-minute polling (src/features/live/lib/live.ts shouldPoll).
select cron.schedule('poll-live', '* * * * *', $$ select public.call_cron_route('/api/cron/poll-live') $$);
select cron.schedule('sync-videos', '17 */6 * * *', $$ select public.call_cron_route('/api/cron/sync-videos') $$);

-- Keep pg_net's response log small.
select cron.schedule('purge-net-responses', '0 4 * * *', $$ delete from net._http_response where created < now() - interval '1 day' $$);
