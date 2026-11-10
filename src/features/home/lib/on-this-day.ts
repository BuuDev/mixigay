import { vnDay } from "@/features/schedule/lib/overrides";
import type { Video } from "@/features/videos/types";
import { thumbnailFor } from "@/shared/lib/links";

// "Hôm nay năm xưa": the channel's videos from this Vietnam day-month in earlier
// years. Pure; only the few picked videos leave the full channel list.

const DAY_MS = 86_400_000;
/** Days either side of today used when no video falls on the exact day-month. */
export const NEARBY_DAYS = 3;
export const MAX_ON_THIS_DAY = 8;

export interface OnThisDayVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  publishedAt: string;
  wasLive: boolean;
}

export interface OnThisDayYear {
  year: number;
  /** 1 = last year. */
  yearsAgo: number;
  /** Most-viewed first. */
  videos: OnThisDayVideo[];
}

export interface OnThisDayPick {
  /** "exact": same day-month; "nearby": within ±NEARBY_DAYS because the exact day had none. */
  mode: "exact" | "nearby";
  /** Most recent year first. */
  years: OnThisDayYear[];
}

type Source = Pick<Video, "videoId" | "title" | "publishedAt" | "viewCount" | "wasLive" | "thumbnailUrl">;

interface Hit {
  video: Source;
  year: number;
}

const byViews = (a: Source, b: Source) => b.viewCount - a.viewCount || a.videoId.localeCompare(b.videoId);

function toItem(v: Source): OnThisDayVideo {
  return {
    videoId: v.videoId,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl ?? thumbnailFor(v.videoId),
    viewCount: v.viewCount,
    publishedAt: v.publishedAt,
    wasLive: v.wasLive,
  };
}

/**
 * Videos published on today's Vietnam day-month in earlier years, grouped by year
 * (newest year first, most-viewed first inside a year). When the exact day has none,
 * falls back to ±3 days (`mode: "nearby"`, label it). At most `max` videos, spread
 * across years round-robin so one busy year cannot fill the row. Null when empty.
 *
 * `now` must be a request-time clock: under Cache Components call this after
 * `await connection()` (or in a client with `useNow`), never during prerender.
 */
export function pickOnThisDay(videos: readonly Source[], now: Date, max = MAX_ON_THIS_DAY): OnThisDayPick | null {
  const today = vnDay(now);
  const thisYear = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const date = today.getUTCDate();

  const exact: Hit[] = [];
  const nearby: Hit[] = [];
  for (const v of videos) {
    const t = Date.parse(v.publishedAt);
    if (Number.isNaN(t)) continue;
    const day = vnDay(new Date(t));
    const year = day.getUTCFullYear();
    if (day.getUTCMonth() === month && day.getUTCDate() === date) {
      if (year < thisYear) exact.push({ video: v, year });
      continue;
    }
    // Nearest anniversary of today around the video (handles the new-year edge: 30/12 vs 1/1).
    for (const y of [year - 1, year, year + 1]) {
      if (y >= thisYear) continue;
      const diff = Math.abs(day.getTime() - Date.UTC(y, month, date)) / DAY_MS;
      if (diff <= NEARBY_DAYS) {
        nearby.push({ video: v, year: y });
        break;
      }
    }
  }

  const mode = exact.length ? "exact" : "nearby";
  const hits = exact.length ? exact : nearby;
  if (!hits.length || max <= 0) return null;

  const groups = new Map<number, Source[]>();
  for (const h of hits) groups.set(h.year, [...(groups.get(h.year) ?? []), h.video]);
  const years = [...groups.keys()].sort((a, b) => b - a);
  const sorted = years.map((y) => [...(groups.get(y) ?? [])].sort(byViews));

  // Round-robin: every year's top video first, then the second ones, up to `max`.
  const picked = years.map(() => [] as Source[]);
  let left = max;
  for (let rank = 0; left > 0; rank++) {
    let any = false;
    for (let i = 0; i < years.length && left > 0; i++) {
      const v = sorted[i][rank];
      if (!v) continue;
      picked[i].push(v);
      left -= 1;
      any = true;
    }
    if (!any) break;
  }

  return {
    mode,
    years: years.map((year, i) => ({ year, yearsAgo: thisYear - year, videos: picked[i].map(toItem) })).filter((g) => g.videos.length > 0),
  };
}

/** "3 năm trước hôm nay" / "Quanh ngày này 3 năm trước"; one year back reads "Năm ngoái…". */
export function yearsAgoLabel(yearsAgo: number, mode: OnThisDayPick["mode"]): string {
  const when = yearsAgo === 1 ? "năm ngoái" : `${yearsAgo} năm trước`;
  if (mode === "exact") return yearsAgo === 1 ? "Năm ngoái, đúng hôm nay" : `${when} hôm nay`;
  return `Quanh ngày này ${when}`;
}
