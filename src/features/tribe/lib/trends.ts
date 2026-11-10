import type { ClassifiedVideo } from "@/features/videos/types";

// "Bộ Tộc đang rần rần": topics counted from recent stream/video titles. The
// topics are curated (what the community talks about); the numbers are not —
// they come from the channel's own titles, so the ranking moves with the stream.

export interface Topic {
  id: string;
  label: string;
  keywords: string[];
}

export const TOPICS: Topic[] = [
  { id: "delta-force", label: "Delta Force & Ao Làng", keywords: ["delta force", " df ", "ao làng", "harmonica"] },
  { id: "an-lieng", label: "Phòng Trà An Liễng", keywords: ["an liễng", "ca hát", "ca sĩ", "test mic"] },
  { id: "fan-games", label: "Game Bộ Tộc tự làm", keywords: ["fan thiết kế", "thành viên bộ tộc", "stream escape", "game viewer"] },
  { id: "tetris", label: "Phong trào Tetris", keywords: ["tetris"] },
  { id: "dinosaur", label: "Khủng long The Isle", keywords: ["the isle", "khủng long", "t-rex"] },
  { id: "business", label: "Ông chủ Moi kinh doanh", keywords: ["simulator", "ông chủ moi", "shop", "tiệm"] },
  { id: "pewpew", label: "Cặp bài trùng với Pewpew", keywords: ["pewpew"] },
  { id: "fan-meet", label: "Gặp gỡ fan & YEP", keywords: ["gặp gỡ fan", "off fan", "thượng hải", "yep", "ăn cưới bạn fan", "ăn cưới fan"] },
  { id: "moi-xoang", label: "Giải đấu Moi Xoang", keywords: ["moi xoang", "moixoang"] },
  { id: "du-an-ma", label: "“Dự án ma”", keywords: ["dự án ma"] },
];

export interface TrendingTopic extends Topic {
  count: number;
  latest: ClassifiedVideo;
}

/** Topics mentioned in titles published within `days` of `now`, most mentioned first. */
export function trendingTopics(videos: ClassifiedVideo[], now: Date, days = 30): TrendingTopic[] {
  const since = now.getTime() - days * 86_400_000;
  const recent = videos.filter((v) => Date.parse(v.publishedAt) >= since);
  const out: TrendingTopic[] = [];
  for (const t of TOPICS) {
    // Pad with spaces so short keywords like " df " only match whole words.
    const hits = recent.filter((v) => t.keywords.some((k) => ` ${v.title.toLowerCase()} `.includes(k)));
    if (!hits.length) continue;
    const latest = hits.reduce((a, b) => (Date.parse(b.publishedAt) > Date.parse(a.publishedAt) ? b : a));
    out.push({ ...t, count: hits.length, latest });
  }
  return out.sort((a, b) => b.count - a.count || Date.parse(b.latest.publishedAt) - Date.parse(a.latest.publishedAt));
}

/** Reference time for "recent": the newest video, so pages stay cacheable (no clock read). */
export function newestPublishedAt(videos: ClassifiedVideo[]): Date {
  return new Date(videos.reduce((max, v) => Math.max(max, Date.parse(v.publishedAt)), 0));
}
