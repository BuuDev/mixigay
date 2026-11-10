import type { ClassifiedVideo } from "@/features/videos/types";
import { slugify } from "@/shared/lib/text";

// The channel names its uploads "(Series #n) Episode title", e.g.
// "(Phòng Trà An Liễng #4) Đêm nhạc…" or "(GTA V 2026) Tam tấu…". Restreams use
// "(Restream) …" and are not a series.

export interface ParsedTitle {
  series: string;
  slug: string;
  episode?: number;
  rest: string;
}

const NOT_SERIES = new Set(["restream", "live", "shorts"]);

export function parseSeriesTitle(title: string): ParsedTitle | null {
  const m = title.match(/^\s*\(([^()]{2,60})\)\s*(.*)$/);
  if (!m) return null;
  const inside = m[1].trim();
  const ep = inside.match(/^(.*?)\s*#\s*(\d{1,4})$/);
  const series = (ep ? ep[1] : inside).trim();
  const slug = slugify(series);
  if (!slug || NOT_SERIES.has(slug)) return null;
  return { series, slug, episode: ep ? Number(ep[2]) : undefined, rest: m[2].trim() };
}

export interface Series {
  slug: string;
  name: string;
  episodes: (ClassifiedVideo & { episode?: number; episodeTitle: string })[];
  latestAt: string;
  totalViews: number;
}

/**
 * Groups videos into series, newest activity first; episodes newest first.
 * A lone "(Tên #1)" or "(Tên)" is noise, not a series: keep a group only when it has two
 * videos or an episode number of 2+ (earlier parts may be unlisted). With the real channel
 * this took /series from 474 cards to the ones that are actually series.
 */
export function groupSeries(videos: ClassifiedVideo[]): Series[] {
  const map = new Map<string, Series>();
  for (const v of videos) {
    const p = parseSeriesTitle(v.title);
    if (!p) continue;
    const s = map.get(p.slug) ?? { slug: p.slug, name: p.series, episodes: [], latestAt: v.publishedAt, totalViews: 0 };
    s.episodes.push({ ...v, episode: p.episode, episodeTitle: p.rest || v.title });
    s.totalViews += v.viewCount;
    if (v.publishedAt > s.latestAt) s.latestAt = v.publishedAt;
    map.set(p.slug, s);
  }
  for (const s of map.values()) {
    s.episodes.sort((a, b) => (b.episode ?? 0) - (a.episode ?? 0) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  }
  return [...map.values()]
    .filter((s) => s.episodes.length >= 2 || s.episodes.some((e) => (e.episode ?? 0) >= 2))
    .sort((a, b) => Date.parse(b.latestAt) - Date.parse(a.latestAt));
}
