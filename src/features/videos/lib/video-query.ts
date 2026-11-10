// /video filters live in the URL (?game=gta-v&sort=newest&n=96): the server sends only the
// cards on screen instead of the whole channel (3,000+ videos was a 9 MB page), and a
// filtered list can be shared as a link.
import { UNCLASSIFIED } from "./classify";
import type { ClassifiedVideo, Game } from "../types";

export type VideoSort = "views" | "newest";
export interface VideoQuery {
  /** "all", a game slug, or UNCLASSIFIED. */
  game: string;
  sort: VideoSort;
  /** How many cards to show (grows by PAGE with "Xem thêm"). */
  limit: number;
}

export const PAGE = 48;
export const MAX_LIMIT = 480;
export const DEFAULT_QUERY: VideoQuery = { game: "all", sort: "views", limit: PAGE };

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Unknown games, sorts and sizes fall back to the defaults instead of erroring. */
export function parseVideoQuery(params: Params, gameSlugs: readonly string[]): VideoQuery {
  const game = one(params.game);
  const sort = one(params.sort);
  const n = Number(one(params.n));
  return {
    game: game && (game === UNCLASSIFIED || gameSlugs.includes(game)) ? game : "all",
    sort: sort === "newest" ? "newest" : "views",
    limit: Number.isInteger(n) && n > 0 ? Math.min(MAX_LIMIT, Math.ceil(n / PAGE) * PAGE) : PAGE,
  };
}

/** Link for a query; defaults are left out so "/video" stays the canonical URL. */
export function videoHref(q: VideoQuery): string {
  const sp = new URLSearchParams();
  if (q.game !== "all") sp.set("game", q.game);
  if (q.sort !== "views") sp.set("sort", q.sort);
  if (q.limit !== PAGE) sp.set("n", String(q.limit));
  const s = sp.toString();
  return s ? `/video?${s}` : "/video";
}

export interface VideoTab {
  slug: string;
  label: string;
  count: number;
}

/** Filter chips with counts: "Tất cả", each game that has videos, then "Chưa phân loại". */
export function videoTabs(videos: readonly ClassifiedVideo[], games: readonly Game[]): VideoTab[] {
  const counts = new Map<string, number>();
  for (const v of videos) counts.set(v.gameSlug, (counts.get(v.gameSlug) ?? 0) + 1);
  return [
    { slug: "all", label: "Tất cả", count: videos.length },
    ...games.map((g) => ({ slug: g.slug, label: g.name, count: counts.get(g.slug) ?? 0 })),
    { slug: UNCLASSIFIED, label: "Chưa phân loại", count: counts.get(UNCLASSIFIED) ?? 0 },
  ].filter((t) => t.slug === "all" || t.count > 0);
}

/** The videos for a query, sorted, plus the total before the page cut. */
export function selectVideos(videos: readonly ClassifiedVideo[], q: VideoQuery): { items: ClassifiedVideo[]; total: number } {
  const matching = videos.filter((v) => q.game === "all" || v.gameSlug === q.game);
  const sorted = [...matching].sort((a, b) =>
    q.sort === "views" ? b.viewCount - a.viewCount || b.publishedAt.localeCompare(a.publishedAt) : b.publishedAt.localeCompare(a.publishedAt),
  );
  return { items: sorted.slice(0, q.limit), total: matching.length };
}
