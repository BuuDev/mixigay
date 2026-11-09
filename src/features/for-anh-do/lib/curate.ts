import type { FanArtItem } from "@/features/fan-art/types";
import type { FanSong } from "@/features/music/types";
import { allowedSuggestionUrl } from "@/features/suggestions/lib/url-policy";
import type { Suggestion } from "@/features/suggestions/types";

export interface StreamReadyGame {
  id: string;
  name: string;
  reason: string;
  upvotes: number;
  sourceLabel: string;
  safeUrl: string | null;
  genres: string[];
  price?: string;
}

const SOURCE_LABELS: Record<Suggestion["source"], string> = {
  steam: "Game trên Steam",
  "viewer-made": "Game Bộ Tộc tự làm",
  other: "Game đề xuất",
};

/**
 * Selects the top pending game suggestions for anh Độ to read on stream.
 * - Prefers suggestions from the last 7 days when available, falling back to top overall pending.
 * - Drops raw user display names (`author`) and strips any URL that does not pass `allowedSuggestionUrl`.
 */
export function selectTopGamesForStream(suggestions: Suggestion[], nowMs: number, limit = 6): StreamReadyGame[] {
  const pending = suggestions.filter((s) => s.status === "pending");
  const weekAgo = nowMs - 7 * 86_400_000;
  const recent = pending.filter((s) => Date.parse(s.createdAt) >= weekAgo);
  const pool = recent.length >= 3 ? recent : pending;

  return [...pool]
    .sort((a, b) => b.upvotes - a.upvotes || Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      name: s.name,
      reason: s.reason,
      upvotes: s.upvotes,
      sourceLabel: SOURCE_LABELS[s.source],
      safeUrl: s.steam?.appId
        ? `https://store.steampowered.com/app/${s.steam.appId}`
        : allowedSuggestionUrl(s.url),
      genres: s.steam?.genres ?? [],
      price: s.steam?.price,
    }));
}

export function selectLatestSongsForStream(songs: FanSong[], limit = 4): FanSong[] {
  return [...songs]
    .sort((a, b) => b.upvotes - a.upvotes || Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export function selectLatestArtForStream(art: FanArtItem[], limit = 6): FanArtItem[] {
  return [...art]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

