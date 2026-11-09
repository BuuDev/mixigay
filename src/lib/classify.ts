import type { Game, Video } from "./types";

export const UNCLASSIFIED = "unclassified";

/**
 * Game slug for a video: an admin's manual tag wins, then the first game whose
 * keyword appears in the title, else UNCLASSIFIED (left for an admin to tag).
 * Vlog keywords are checked last because words like "ăn" or "review" also show
 * up in gaming titles.
 */
export function classifyVideo(video: Video, games: Game[]): string {
  if (video.manualGameSlug) return video.manualGameSlug;
  const title = video.title.toLowerCase();
  const ordered = [...games.filter((g) => !g.isVlog), ...games.filter((g) => g.isVlog)];
  for (const game of ordered) {
    if (game.keywords.some((k) => title.includes(k))) return game.slug;
  }
  return UNCLASSIFIED;
}
