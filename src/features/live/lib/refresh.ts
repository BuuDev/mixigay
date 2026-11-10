// When an open tab re-reads /api/live (ADR-019). The server plans its own next check
// (live_poll_state.next_check_at); tabs sleep until just after it, spread over a minute so
// that thousands of tabs do not all ask at the same second. Off-hours that is hours away,
// so a tab left open costs almost nothing until the shift starts.

/** pg_cron ticks once a minute and a check takes a few seconds: read after that. */
export const SETTLE_MS = 90_000;
/** Spread of the reads, so a crowd does not hit the CDN in the same second. */
export const SPREAD_MS = 60_000;
/** The server's plan is already past (it is late, failing, or the copy is stale): first retry. */
export const RETRY_MS = 2 * 60_000;
/** Retries double while the same past plan keeps coming back, up to this. */
export const MAX_RETRY_MS = 30 * 60_000;
/** Without a plan (demo, old cache), read again at most this often. */
export const FALLBACK_MS = 30 * 60_000;
/**
 * A visible tab never sleeps longer than this, so it eventually sees what the server learnt
 * in between (an unscheduled live woken by WebSub, an early end, a moved slot).
 */
export const MAX_SLEEP_MS = 2 * 3_600_000;
/** A tab coming back to the foreground re-reads when its last read is older than this. */
export const STALE_ON_RETURN_MS = 30 * 60_000;

/**
 * Milliseconds from `now` until the next read. `random` is in [0, 1). `misses` counts the
 * reads in a row that returned a plan already in the past (0 for a fresh plan): each one
 * doubles the wait, so a failing server is not hammered by every open tab.
 */
export function refreshDelay(nextCheckAt: string | undefined, now: number, random: number, misses = 0): number {
  const spread = Math.floor(random * SPREAD_MS);
  const due = nextCheckAt ? Date.parse(nextCheckAt) : NaN;
  if (Number.isNaN(due)) return FALLBACK_MS + spread;
  const wait = due + SETTLE_MS - now;
  if (wait > 0) return Math.min(MAX_SLEEP_MS, wait + spread);
  return Math.min(MAX_RETRY_MS, RETRY_MS * 2 ** Math.max(0, misses)) + spread;
}
