import { gradientFor } from "../classify";
import { thumbnailFor } from "../youtube/parse";
import type { Game, LiveStatus, PlayedGame, ScheduleSlot, Suggestion, Video } from "../types";
import type { GameRow, LiveStatusRow, PlayedGameRow, ScheduleSlotRow, SuggestionRow, VideoRow } from "./rows";

export function mapGame(r: GameRow): Game {
  return {
    slug: r.slug,
    name: r.name,
    isVlog: r.is_vlog,
    keywords: (r.game_keywords ?? []).map((k) => k.keyword),
    cover: gradientFor(r.slug),
  };
}

export function mapVideo(r: VideoRow): Video & { autoGameSlug?: string } {
  return {
    videoId: r.video_id,
    title: r.title,
    publishedAt: r.published_at,
    viewCount: Number(r.view_count),
    durationMinutes: Math.round(r.duration_seconds / 60),
    wasLive: r.was_live,
    thumbnailUrl: r.thumbnail_url ?? thumbnailFor(r.video_id),
    playlistIds: r.playlist_ids,
    manualGameSlug: r.manual_game_slug ?? undefined,
    autoGameSlug: r.auto_game_slug ?? undefined,
  };
}

export function mapLiveStatus(r: LiveStatusRow): LiveStatus {
  return {
    state: r.state,
    videoId: r.video_id ?? undefined,
    title: r.title ?? undefined,
    startTime: r.start_time ?? undefined,
    concurrentViewers: r.concurrent_viewers ?? undefined,
    thumbnailUrl: r.video_id ? thumbnailFor(r.video_id) : undefined,
    checkedAt: r.checked_at ?? new Date(0).toISOString(),
  };
}

export function mapSlot(r: ScheduleSlotRow): ScheduleSlot {
  return {
    id: r.id,
    dayOfWeek: r.day_of_week,
    time: r.time_vn.slice(0, 5), // Postgres returns "HH:mm:ss"
    title: r.title,
    gameSlug: r.game_slug ?? undefined,
    note: r.note ?? undefined,
  };
}

export function mapPlayed(r: PlayedGameRow): PlayedGame {
  return { gameSlug: r.game_slug, status: r.status, sessions: r.sessions, lastPlayed: r.last_played ?? "" };
}

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
    createdAt: r.created_at,
    upvotes: r.upvotes,
    status: r.status,
    linkedGameSlug: r.linked_game_slug ?? undefined,
    steam: r.steam_app_id ? steamInfo(r.steam_app_id, r.steam_data) : undefined,
  };
}
