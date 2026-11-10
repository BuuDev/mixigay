import { UNCLASSIFIED } from "./classify";
import type { ClassifiedVideo, Game } from "../types";

/** A game's cover image, taken from one of anh Độ's own videos of that game. */
export interface GameCover {
  thumbnailUrl: string;
  videoId: string;
  title: string;
  publishedAt: string;
  /** True when the cover comes from a past stream rather than an upload. */
  wasLive: boolean;
}

/** Plain-object form of the covers map, safe to pass to client components. */
export type GameCoverRecord = Record<string, GameCover>;

/** True when `a` should be the cover instead of `b`. */
function better(a: ClassifiedVideo, b: ClassifiedVideo): boolean {
  // A past stream shows the game as it was played live, so it beats any upload, however newer the upload is.
  if (a.wasLive !== b.wasLive) return a.wasLive;
  const diff = Date.parse(a.publishedAt) - Date.parse(b.publishedAt);
  if (diff !== 0) return diff > 0;
  // Same instant: pick a stable winner so the cover does not flip between renders.
  return a.videoId < b.videoId;
}

/**
 * Picks one cover per game from already-classified videos:
 * the newest was-live stream of that game, or the newest upload when it was never streamed.
 * Shorts, unclassified videos and videos without a thumbnail are skipped.
 * When `games` is given, only those slugs get a cover.
 */
export function gameCovers(videos: readonly ClassifiedVideo[], games?: readonly Game[]): Map<string, GameCover> {
  const allowed = games ? new Set(games.map((g) => g.slug)) : null;
  const best = new Map<string, ClassifiedVideo>();
  for (const v of videos) {
    if (v.isShort || !v.thumbnailUrl || v.gameSlug === UNCLASSIFIED) continue;
    if (allowed && !allowed.has(v.gameSlug)) continue;
    const current = best.get(v.gameSlug);
    if (!current || better(v, current)) best.set(v.gameSlug, v);
  }
  const covers = new Map<string, GameCover>();
  for (const [slug, v] of best)
    covers.set(slug, { thumbnailUrl: v.thumbnailUrl!, videoId: v.videoId, title: v.title, publishedAt: v.publishedAt, wasLive: v.wasLive });
  return covers;
}

/** `gameCovers` as a plain object, for props of client components. */
export function gameCoverRecord(videos: readonly ClassifiedVideo[], games?: readonly Game[]): GameCoverRecord {
  return Object.fromEntries(gameCovers(videos, games));
}
