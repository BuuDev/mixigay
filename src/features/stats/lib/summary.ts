import type { LiveSample, StreamMeta, StreamSession, StreamStats, StreamStreak, StreamSummary, WeekdayStart } from "../types";
import { downsample, sessionize } from "./sessions";
import { streamDayOf } from "./vn-time";

/** Monday first, the way a Vietnamese week is read. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/** Average start time per weekday, Vietnam time, by stream day (see vn-time.ts). Monday first. */
export function averageStartByWeekday(sessions: readonly Pick<StreamSummary, "startAt">[]): WeekdayStart[] {
  const sum = new Array<number>(7).fill(0);
  const count = new Array<number>(7).fill(0);
  for (const s of sessions) {
    const day = streamDayOf(s.startAt);
    sum[day.weekday] += day.minute;
    count[day.weekday] += 1;
  }
  return WEEK_ORDER.map((weekday) => ({
    weekday,
    count: count[weekday],
    avgStartMinute: count[weekday] ? Math.round(sum[weekday] / count[weekday]) : null,
  }));
}

/** Mean length in minutes of streams that lasted at least a minute; null when none. */
export function averageDuration(sessions: readonly Pick<StreamSummary, "durationMinutes">[]): number | null {
  const lengths = sessions.map((s) => s.durationMinutes).filter((m) => m > 0);
  return lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : null;
}

/** Longest run of consecutive stream days with at least one stream. Ties go to the most recent run. */
export function longestStreak(sessions: readonly Pick<StreamSummary, "startAt">[]): StreamStreak | null {
  const days = new Map<number, string>();
  for (const s of sessions) {
    const d = streamDayOf(s.startAt);
    days.set(d.index, d.key);
  }
  if (!days.size) return null;
  const sorted = [...days.keys()].sort((a, b) => a - b);
  let best = { from: sorted[0], to: sorted[0] };
  let runFrom = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    if (i < sorted.length && sorted[i] === sorted[i - 1] + 1) continue;
    const runTo = sorted[i - 1];
    if (runTo - runFrom >= best.to - best.from) best = { from: runFrom, to: runTo };
    if (i < sorted.length) runFrom = sorted[i];
  }
  return { days: best.to - best.from + 1, from: days.get(best.from)!, to: days.get(best.to)! };
}

/** Streams with the highest peak concurrent viewers; ties go to the newer stream. */
export function topByPeak<T extends StreamSummary>(sessions: readonly T[], n: number): T[] {
  return sessions
    .filter((s) => s.peakViewers > 0)
    .sort((a, b) => b.peakViewers - a.peakViewers || Date.parse(b.startAt) - Date.parse(a.startAt))
    .slice(0, n);
}

function summary(s: StreamSession): StreamSummary {
  return {
    videoId: s.videoId,
    title: s.title,
    startAt: s.startAt,
    endAt: s.endAt,
    durationMinutes: s.durationMinutes,
    peakViewers: s.peakViewers,
    peakMinute: s.peakMinute,
    avgViewers: s.avgViewers,
    sampleCount: s.sampleCount,
  };
}

export interface StatsOptions {
  windowDays: number;
  recentCount?: number;
  topCount?: number;
  /** Max points per chart series sent to the browser. */
  maxPoints?: number;
}

/** Everything /thong-ke shows, from raw samples and video metadata. */
export function buildStreamStats(samples: readonly LiveSample[], metas: readonly StreamMeta[], opts: StatsOptions): StreamStats {
  const { windowDays, recentCount = 12, topCount = 5, maxPoints = 180 } = opts;
  const sessions = sessionize(samples, metas);
  return {
    windowDays,
    streamCount: sessions.length,
    avgDurationMinutes: averageDuration(sessions),
    streak: longestStreak(sessions),
    weekdays: averageStartByWeekday(sessions),
    top: topByPeak(sessions, topCount).map(summary),
    recent: sessions.slice(0, recentCount).map((s) => ({ ...summary(s), points: downsample(s.points, maxPoints) })),
  };
}
