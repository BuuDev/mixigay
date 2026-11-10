import { nextSlot } from "@/features/schedule/lib/schedule";
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

const DENSE_WINDOW_MS = 2 * 3_600_000;
const SPARSE_INTERVAL_MS = 5 * 60_000;

/**
 * The cron fires every minute; poll every minute while live/upcoming or within
 * ±2 h of a scheduled slot, every 5 minutes otherwise. Keeps quota well under budget.
 * One-day overrides count: a moved or extra stream gets the dense window, a cancelled
 * day does not (saves quota).
 */
export function shouldPoll(opts: { now: Date; state: LiveState; lastCheckedAt?: string; schedule: ScheduleSlot[]; overrides?: ScheduleOverride[] }): boolean {
  const { now, state, lastCheckedAt, schedule, overrides } = opts;
  if (state !== "offline" || !lastCheckedAt) return true;
  if (now.getTime() - Date.parse(lastCheckedAt) >= SPARSE_INTERVAL_MS - 5_000) return true;
  // nextSlot is strictly after `from`, so look from 2 h ago to also catch a stream that just started.
  const next = nextSlot(schedule, new Date(now.getTime() - DENSE_WINDOW_MS), overrides);
  return next !== null && next.at.getTime() - now.getTime() <= DENSE_WINDOW_MS;
}

export function becameLive(previous: LiveState, next: DerivedLive, previousVideoId?: string): boolean {
  return next.state === "live" && (previous !== "live" || previousVideoId !== next.videoId);
}
