import type { Suggestion } from "../types";

export interface SuggestionRow {
  id: string;
  author_id?: string;
  name: string;
  source: "steam" | "viewer-made" | "other";
  url: string | null;
  reason: string;
  status: "pending" | "played" | "rejected";
  linked_game_slug: string | null;
  steam_app_id: number | null;
  steam_data: { price: string; genres: string[]; headerImage?: string } | null;
  upvotes: number;
  hidden: boolean;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null; verified?: boolean } | null;
}

export const SUGGESTION_SELECT =
  "id,author_id,name,source,url,reason,status,linked_game_slug,steam_app_id,steam_data,upvotes,hidden,created_at,profiles!author_id(display_name,avatar_url,verified)";

/** steam_data is jsonb: accept it only in the expected shape so one bad row cannot crash the page. */
function steamInfo(appId: number, data: unknown): Suggestion["steam"] {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  if (typeof d.price !== "string" || !Array.isArray(d.genres) || !d.genres.every((g) => typeof g === "string")) return undefined;
  const headerImage = typeof d.headerImage === "string" && d.headerImage.startsWith("https://") ? d.headerImage : undefined;
  return { appId, price: d.price, genres: d.genres as string[], headerImage };
}

export function mapSuggestion(r: SuggestionRow): Suggestion {
  return {
    id: r.id,
    name: r.name,
    source: r.source,
    url: r.url ?? undefined,
    reason: r.reason,
    author: r.profiles?.display_name ?? "fan",
    authorAvatar: r.profiles?.avatar_url ?? undefined,
    authorId: r.author_id,
    authorVerified: r.profiles?.verified === true,
    createdAt: r.created_at,
    upvotes: r.upvotes,
    status: r.status,
    linkedGameSlug: r.linked_game_slug ?? undefined,
    steam: r.steam_app_id ? steamInfo(r.steam_app_id, r.steam_data) : undefined,
  };
}
