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

-- Ticks every minute but calls the app only when poll-live's own timer is due
-- (public.poll_live_due, migration 20261111120000; plan in src/features/live/lib/live.ts nextCheckAt).
-- Off-hours this is one SQL read per minute: no Vercel call, no YouTube unit, no Realtime message.
select cron.schedule('poll-live', '* * * * *', $$ select public.call_cron_route('/api/cron/poll-live') where public.poll_live_due() $$);
select cron.schedule('sync-videos', '17 */6 * * *', $$ select public.call_cron_route('/api/cron/sync-videos') $$);
-- Alerts admins (ADMIN_ALERT_* env) when the moderation queue spikes; no-op without them.
select cron.schedule('moderation-alert', '*/5 * * * *', $$ select public.call_cron_route('/api/cron/moderation-alert') $$);
-- Re-subscribes YouTube WebSub daily (10-day lease, so a missed day or two is harmless).
-- No YouTube quota; skipped while WEBSUB_SECRET is empty or the site URL is localhost.
select cron.schedule('websub-renew', '23 3 * * *', $$ select public.call_cron_route('/api/cron/websub-renew') $$);

-- Keep pg_net's response log small.
select cron.schedule('purge-net-responses', '0 4 * * *', $$ delete from net._http_response where created < now() - interval '1 day' $$);

-- live_samples: one sample per 5 minutes after 30 days (public.compact_live_samples,
-- migration 20261110130000). Pure SQL, no YouTube quota.
select cron.schedule('compact-live-samples', '30 4 * * *', $$ select public.compact_live_samples() $$);

-- Rate-limit bookkeeping for sign-up / sign-in (migration 20261110120000).
select cron.schedule('purge-auth-attempts', '45 4 * * *', $$ delete from public.auth_attempts where at < now() - interval '2 days' $$);
