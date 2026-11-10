-- Admin alerts when the moderation queue spikes (raid, spam wave). One row per alert
-- kind per hour is claimed before sending, so overlapping cron runs cannot double-post
-- (same pattern as notifications_log). Service role only: no grants, no policies.
create table public.admin_alerts (
  kind text not null check (kind in ('submission_spike', 'report_spike')),
  bucket text not null check (bucket ~ '^\d{4}-\d{2}-\d{2}T\d{2}$'), -- UTC hour
  sent_at timestamptz not null default now(),
  primary key (kind, bucket)
);
alter table public.admin_alerts enable row level security;
revoke all on public.admin_alerts from anon, authenticated;
