import { nextSlot, prevSlot } from "@/features/schedule/lib/schedule";
import type { LiveState } from "../types";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import type { YtVideo } from "@/server/youtube/client";

export interface DerivedLive {
  state: LiveState;
  videoId?: string;
  title?: string;
  startTime?: string;
  concurrentViewers?: number;
}

/** An upcoming stream scheduled further out than this is shown as offline. */
const UPCOMING_WINDOW_MS = 24 * 3_600_000;
/** Scheduled streams that never started are dropped after this. */
const STALE_UPCOMING_MS = 6 * 3_600_000;

/**
 * Channel state from freshly fetched videos: the live stream with the most
 * viewers wins, otherwise the soonest upcoming one within 24 h, else offline.
 */
export function deriveLiveStatus(videos: YtVideo[], now: Date): DerivedLive {
  const live = videos.filter((v) => v.snippet.liveBroadcastContent === "live").sort((a, b) => viewers(b) - viewers(a))[0];
  if (live) {
    return {
      state: "live",
      videoId: live.id,
      title: live.snippet.title,
      startTime: live.liveStreamingDetails?.actualStartTime,
      concurrentViewers: viewers(live),
    };
  }

  const upcoming = videos
    .filter((v) => v.snippet.liveBroadcastContent === "upcoming" && v.liveStreamingDetails?.scheduledStartTime)
    .map((v) => ({ v, at: Date.parse(v.liveStreamingDetails!.scheduledStartTime!) }))
    .filter(({ at }) => at - now.getTime() <= UPCOMING_WINDOW_MS && now.getTime() - at <= STALE_UPCOMING_MS)
    .sort((a, b) => a.at - b.at)[0];
  if (upcoming) {
    return {
      state: "upcoming",
      videoId: upcoming.v.id,
      title: upcoming.v.snippet.title,
      startTime: upcoming.v.liveStreamingDetails!.scheduledStartTime,
    };
  }
  return { state: "offline" };
}

function viewers(v: YtVideo): number {
  return Number(v.liveStreamingDetails?.concurrentViewers ?? 0);
}

/** Look this long before a scheduled slot (anh Độ sometimes starts a little early). */
export const WINDOW_BEFORE_MS = 10 * 60_000;
/** …and keep looking this long after it, in case the stream starts late. */
export const WINDOW_AFTER_MS = 60 * 60_000;
/** Start of a shift: how often we look until the stream is on (ADR-019). */
export const DENSE_EVERY_MS = 2 * 60_000;
/** A stream usually runs about this long: the one check that looks for its end. */
export const LIVE_SHIFT_MS = 4 * 3_600_000;
/** Still live after the shift: look again this often until it ends. */
export const OVERTIME_EVERY_MS = 15 * 60_000;
/** A scheduled stream is watched from this long before its start time. */
export const UPCOMING_LEAD_MS = 2 * 60_000;
/** Safety net when WebSub misses an unscheduled stream; never sleep longer than this. */
export const SAFETY_EVERY_MS = 6 * 3_600_000;

export type PollReason = "live_end" | "live_overtime" | "upcoming_soon" | "upcoming_wait" | "slot_window" | "next_slot" | "safety";

export interface NextCheck {
  at: Date;
  reason: PollReason;
}

/**
 * When poll-live should look again, given what this check found (ADR-018, made minimal in
 * ADR-019): every 2 minutes at the start of a shift until the stream is on, then nothing
 * until about 4 hours after it started (one check for the end, then every 15 minutes while
 * it runs over). Off-hours: sleep until the next slot window, at most 6 hours. Unscheduled
 * streams and early ends reach us through WebSub, which wakes the timer. One-day overrides
 * count: a moved or extra stream gets a window, a cancelled day does not.
 */
export function nextCheckAt(opts: {
  now: Date;
  live: DerivedLive;
  /** State before this check: a stream that just ended skips the rest of its window. */
  previous: LiveState;
  /** Start of the stream that was live before this check (only a stream started in the window ends it). */
  previousStart?: string;
  schedule: ScheduleSlot[];
  overrides?: ScheduleOverride[];
}): NextCheck {
  const { now, live, previous, previousStart, schedule, overrides } = opts;
  const t = now.getTime();
  const safety = t + SAFETY_EVERY_MS;
  // Rounded up to the minute: pg_cron ticks on the minute, so "12:52:03" would only run at 12:53.
  const at = (ms: number, reason: PollReason): NextCheck => ({ at: new Date(Math.ceil(Math.max(ms, t + DENSE_EVERY_MS) / 60_000) * 60_000), reason });

  if (live.state === "live") {
    const started = live.startTime ? Date.parse(live.startTime) : t;
    const shiftEnd = started + LIVE_SHIFT_MS;
    return shiftEnd > t + DENSE_EVERY_MS ? at(shiftEnd, "live_end") : at(t + OVERTIME_EVERY_MS, "live_overtime");
  }

  // The schedule's plan: every 2 minutes inside a slot window, else sleep until the next one.
  const current = prevSlot(schedule, new Date(t + WINDOW_BEFORE_MS), overrides);
  const windowStart = current ? current.at.getTime() - WINDOW_BEFORE_MS : -Infinity;
  const inWindow = current !== null && t <= current.at.getTime() + WINDOW_AFTER_MS;
  // A stream that started in this window and has ended closes it; one from earlier does not.
  const endedHere = previous === "live" && (!previousStart || Date.parse(previousStart) >= windowStart);
  let plan: NextCheck;
  if (inWindow && !endedHere) plan = at(t + DENSE_EVERY_MS, "slot_window");
  else {
    // Next window opening after now (nextSlot is strictly after `from`).
    const next = nextSlot(schedule, new Date(t + WINDOW_BEFORE_MS), overrides);
    const opens = next ? next.at.getTime() - WINDOW_BEFORE_MS : Infinity;
    plan = opens <= safety ? at(opens, "next_slot") : at(safety, "safety");
  }

  // A scheduled stream: watch from 2 minutes before its start until an hour after it, every 2 minutes
  // (a placeholder that never starts must not keep us polling). Whichever plan is earlier wins,
  // so a scheduled special later tonight never hides the regular slot.
  if (live.state === "upcoming" && live.startTime) {
    const start = Date.parse(live.startTime);
    const watchFrom = start - UPCOMING_LEAD_MS;
    let upcoming: NextCheck | null = null;
    if (watchFrom <= t) upcoming = t <= start + WINDOW_AFTER_MS ? at(t + DENSE_EVERY_MS, "upcoming_soon") : null;
    else if (watchFrom <= safety) upcoming = at(watchFrom, "upcoming_wait");
    if (upcoming && upcoming.at.getTime() < plan.at.getTime()) return upcoming;
  }
  return plan;
}

export function becameLive(previous: LiveState, next: DerivedLive, previousVideoId?: string): boolean {
  return next.state === "live" && (previous !== "live" || previousVideoId !== next.videoId);
}
