import type { Game, Video } from "../types";

export const UNCLASSIFIED = "unclassified";

/** playlist id → game slug, maintained by an admin. */
export type PlaylistGameMap = ReadonlyMap<string, string>;

type Classifiable = Pick<Video, "title" | "manualGameSlug" | "playlistIds">;

/**
 * Game slug for a video. Priority: an admin's manual tag, then an official
 * playlist mapped to a game, then the first game whose keyword appears in the
 * title, else UNCLASSIFIED (left for an admin to tag). Vlog keywords are checked
 * last because words like "ăn" or "review" also show up in gaming titles.
 */
export function classifyVideo(video: Classifiable, games: Game[], playlists: PlaylistGameMap = new Map()): string {
  if (video.manualGameSlug) return video.manualGameSlug;
  for (const id of video.playlistIds ?? []) {
    const slug = playlists.get(id);
    if (slug) return slug;
  }
  return classifyByKeywords(video.title, games) ?? UNCLASSIFIED;
}

function classifyByKeywords(title: string, games: Game[]): string | undefined {
  const lower = title.toLowerCase();
  const ordered = [...games.filter((g) => !g.isVlog), ...games.filter((g) => g.isVlog)];
  return ordered.find((g) => g.keywords.some((k) => k && lower.includes(k.toLowerCase())))?.slug;
}

const GRADIENTS = [
  "from-amber-500 to-orange-700",
  "from-emerald-500 to-teal-800",
  "from-sky-500 to-indigo-800",
  "from-yellow-400 to-blue-800",
  "from-zinc-600 to-red-900",
  "from-fuchsia-500 to-purple-800",
  "from-rose-400 to-pink-700",
  "from-lime-500 to-green-800",
];

/** Stable placeholder cover for a game that has no image. */
export function gradientFor(slug: string): string {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}
