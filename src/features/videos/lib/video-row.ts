import { parseIsoDuration } from "@/server/youtube/parse";
import { thumbnailFor } from "@/shared/lib/links";
import type { YtVideo } from "@/server/youtube/client";
import type { Chapter } from "../types";
import { parseChapters } from "./chapters";

/** Columns of public.videos that come from YouTube (never the admin's manual tag). */
export interface YtVideoColumns {
  video_id: string;
  title: string;
  published_at: string;
  duration_seconds: number;
  view_count: number;
  thumbnail_url: string;
  was_live: boolean;
  live_state: "none" | "upcoming" | "live" | "completed";
  scheduled_start_at: string | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
  stats_updated_at: string;
  /** Parsed from snippet.description (already fetched, no extra quota); null when there is no valid list. */
  chapters: Chapter[] | null;
}

export function toVideoColumns(v: YtVideo, now: Date): YtVideoColumns {
  const live = v.liveStreamingDetails;
  const state =
    v.snippet.liveBroadcastContent === "live"
      ? "live"
      : v.snippet.liveBroadcastContent === "upcoming"
        ? "upcoming"
        : live?.actualEndTime
          ? "completed"
          : "none";
  return {
    video_id: v.id,
    title: v.snippet.title,
    published_at: v.snippet.publishedAt,
    duration_seconds: parseIsoDuration(v.contentDetails?.duration),
    view_count: Number(v.statistics?.viewCount ?? 0),
    thumbnail_url: v.snippet.thumbnails?.high?.url ?? v.snippet.thumbnails?.medium?.url ?? thumbnailFor(v.id),
    was_live: Boolean(live?.actualStartTime),
    live_state: state,
    scheduled_start_at: live?.scheduledStartTime ?? null,
    actual_start_at: live?.actualStartTime ?? null,
    actual_end_at: live?.actualEndTime ?? null,
    stats_updated_at: now.toISOString(),
    chapters: parseChapters(v.snippet.description),
  };
}
