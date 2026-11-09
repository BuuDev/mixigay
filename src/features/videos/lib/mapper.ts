import { thumbnailFor } from "@/shared/lib/links";
import type { Game, Video } from "../types";
import { gradientFor } from "./classify";

export interface GameRow {
  slug: string;
  name: string;
  is_vlog: boolean;
  cover_url: string | null;
  sort_order: number;
  game_keywords?: { keyword: string }[];
}

export interface VideoRow {
  video_id: string;
  title: string;
  published_at: string;
  duration_seconds: number;
  view_count: number;
  thumbnail_url: string | null;
  was_live: boolean;
  playlist_ids: string[];
  manual_game_slug: string | null;
  auto_game_slug: string | null;
}

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
