---
name: youtube-job
description: Add or change anything that calls the YouTube Data API, Steam, or runs on a schedule in mixi-fan-hub — cron routes, polling, sync, WebSub, notifications (Telegram/Discord/Web Push), stream statistics from live_samples, chapters → timeline. Use for "job", "cron", "poll", "đồng bộ video", "thông báo khi live", "WebSub", "thống kê stream", "quota".
---

# Jobs and external APIs

## Quota is the constraint

YouTube gives 10,000 units/day; jobs stop at `QUOTA_STOP` (8,000) in `src/lib/jobs/context.ts`. Current budget ≈1,500/day (table in `docs/02-architecture.md`).

| Call | Units | Allowed in a job? |
|---|---|---|
| `videos.list` (≤50 ids) | 1 | yes |
| `playlistItems.list`, `playlists.list`, `channels.list` | 1 | yes |
| RSS `youtube.com/feeds/videos.xml` | 0 | yes (15 latest only) |
| `search.list` | **100** | **never** — manual admin action at most |

Before adding a call, write down calls/run × runs/day and add the row to the budget table. Every call goes through `YouTubeClient` (it records units in `api_usage` and enforces the stop). Never `fetch` the API directly.

## Shape of a job

1. Logic in `src/lib/jobs/<job>.ts` as `async (ctx: JobContext, now: Date, opts) => result` — copy `poll-live.ts`. Pure decisions (what to poll, state transitions, parsing) go in a separate pure module with tests (`src/lib/live.ts`, `src/lib/jobs/video-row.ts`).
2. Route `src/app/api/cron/<job>/route.ts`: `export const POST = cronRoute(...)` — this gives the `CRON_SECRET` check, 503 on missing config, 429 on quota. Add `maxDuration` if it pages through a lot.
3. Schedule: add a `cron.schedule(...)` line to `supabase/cron.sql` (run by hand in production; not a migration).
4. After writing data, `revalidateTag(TAGS.x, "max")` for the tags whose pages change.
5. Idempotent: re-running a minute later must not double-insert or double-notify. Use upserts with `onConflict`, and claim-before-send (`notifications_log`) for anything outward.
6. The service-role client exists only inside `JobContext`. Webhooks (`src/app/api/webhooks/**`) verify their signature (WebSub: HMAC-SHA1 `X-Hub-Signature` with `WEBSUB_SECRET`, `timingSafeEqual`) before any DB access.

## Notifications

`src/lib/notify.ts`: plain text only (no Telegram `parse_mode`), Discord `allowed_mentions: { parse: [] }`, never tag Độ or the official channel. Web Push: ask permission only after a user tap (spec §11), store subscriptions per user, delete on 404/410 from the push service.

## Steam

`getSteamDetails` (cached a week, misses for minutes). The preview route requires sign-in. Accept only `https://store.steampowered.com/app/<id>` via `steamAppIdFromUrl`.

## Tests

- Unit: decisions and parsing with fixed `now`.
- `npm run smoke`: the route answers 401 without the secret, 503 without YouTube config.
- Quota: state the expected units/day in the PR description.

Finish with `done-check`; run `quota-auditor` on the diff.
