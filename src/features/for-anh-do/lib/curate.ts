import type { FanArtItem } from "@/features/fan-art/types";
import type { FanSong } from "@/features/music/types";
import { allowedSuggestionUrl } from "@/features/suggestions/lib/url-policy";
import { LINEUP_SIZE, tonightLineup, type LineupPick, type LineupReason } from "@/features/suggestions/lib/ranking";
import type { Suggestion } from "@/features/suggestions/types";

export interface StreamReadyGame {
  id: string;
  name: string;
  reason: string;
  upvotes: number;
  source: Suggestion["source"];
  sourceLabel: string;
  safeUrl: string | null;
  genres: string[];
  price?: string;
  /** Why it is in tonight's lineup. */
  pick: LineupReason;
  /** Chip text for `pick` ("Đang hot", "Mới đề xuất", "Bộ Tộc tự làm"). */
  pickLabel: string;
  /** Cover candidates in order (our Storage copy, then Steam); may all be absent. */
  imageSources: string[];
  /** "Đã chơi" slug, for a stream-thumbnail cover fallback. */
  linkedGameSlug?: string;
}

const SOURCE_LABELS: Record<Suggestion["source"], string> = {
  steam: "Game trên Steam",
  "viewer-made": "Game Bộ Tộc tự làm",
  other: "Game đề xuất",
};

/**
 * Stream-safe view of lineup picks: drops raw user display names (`author`) and strips
 * any URL that does not pass `allowedSuggestionUrl`.
 */
export function streamReadyFromLineup(picks: readonly LineupPick[]): StreamReadyGame[] {
  return picks.map(({ suggestion: s, reason, label }) => ({
    id: s.id,
    name: s.name,
    reason: s.reason,
    upvotes: s.upvotes,
    source: s.source,
    sourceLabel: SOURCE_LABELS[s.source],
    safeUrl: s.steam?.appId ? `https://store.steampowered.com/app/${s.steam.appId}` : allowedSuggestionUrl(s.url),
    genres: s.steam?.genres ?? [],
    price: s.steam?.price,
    pick: reason,
    pickLabel: label,
    imageSources: [s.thumbnailUrl, s.steam?.headerImage].filter((u): u is string => Boolean(u)),
    linkedGameSlug: s.linkedGameSlug,
  }));
}

/**
 * The games for anh Độ to read on stream: tonight's lineup (top 3 hot + newest + fan-made,
 * see `tonightLineup`), not a pure upvote ranking, so new and fan-made games get seen.
 * Pending suggestions only.
 */
export function selectTopGamesForStream(suggestions: Suggestion[], nowMs: number, limit = LINEUP_SIZE): StreamReadyGame[] {
  return streamReadyFromLineup(tonightLineup(suggestions, nowMs).slice(0, limit));
}

export function selectLatestSongsForStream(songs: FanSong[], limit = 4): FanSong[] {
  return [...songs].sort((a, b) => b.upvotes - a.upvotes || Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, limit);
}

export function selectLatestArtForStream(art: FanArtItem[], limit = 6): FanArtItem[] {
  return [...art].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, limit);
}
