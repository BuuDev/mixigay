import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { thumbnailFor } from "@/shared/lib/links";
import { classifyVideo, UNCLASSIFIED } from "../lib/classify";
import { mapGame, mapVideo, type GameRow, type VideoRow } from "../lib/mapper";
import * as mock from "../mock";
import type { ClassifiedVideo, Game } from "../types";

export async function getGames(): Promise<Game[]> {
  "use cache";
  cacheTag(TAGS.games);
  cacheLife("days");
  if (!isSupabaseConfigured) return mock.games;
  const rows = check<GameRow[]>(await publicClient().from("games").select("*, game_keywords(keyword)").order("sort_order").order("name"), "games");
  return rows.map(mapGame);
}

const VIDEO_COLUMNS =
  "video_id,title,published_at,duration_seconds,view_count,thumbnail_url,was_live,playlist_ids,manual_game_slug,auto_game_slug,chapters,is_short";

function toClassified(r: VideoRow): ClassifiedVideo {
  const { autoGameSlug, ...video } = mapVideo(r);
  return { ...video, gameSlug: video.manualGameSlug ?? autoGameSlug ?? UNCLASSIFIED };
}

function mockClassified(): ClassifiedVideo[] {
  // Mock videos use real ids (channel snapshot), so their YouTube thumbnails exist.
  return mock.videos.map((v) => ({
    ...v,
    thumbnailUrl: v.thumbnailUrl ?? thumbnailFor(v.videoId),
    chapters: v.chapters ?? mock.placeholderChapters[v.videoId],
    gameSlug: classifyVideo(v, mock.games),
  }));
}

/** Regular uploads and past streams. Shorts are listed separately by getShorts(). */
export async function getVideos(): Promise<ClassifiedVideo[]> {
  "use cache";
  cacheTag(TAGS.videos, TAGS.games);
  cacheLife("hours");
  if (!isSupabaseConfigured) return mockClassified().filter((v) => !v.isShort);
  // PostgREST caps a response at 1000 rows, so page through.
  const rows: VideoRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const page = check<VideoRow[]>(
      await publicClient()
        .from("videos")
        .select(VIDEO_COLUMNS)
        .neq("live_state", "upcoming")
        .eq("is_short", false)
        .order("published_at", { ascending: false })
        .range(from, from + PAGE - 1),
      "videos",
    );
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows.map(toClassified);
}

/** Newest Shorts (≤ 3 minutes, not a stream; `videos.is_short`), for the Shorts rails. */
export async function getShorts(limit = 24): Promise<ClassifiedVideo[]> {
  "use cache";
  cacheTag(TAGS.videos, TAGS.games);
  cacheLife("hours");
  if (!isSupabaseConfigured)
    return mockClassified()
      .filter((v) => v.isShort)
      .slice(0, limit);
  const rows = check<VideoRow[]>(
    await publicClient().from("videos").select(VIDEO_COLUMNS).eq("is_short", true).order("published_at", { ascending: false }).limit(limit),
    "shorts",
  );
  // Filter again on the flag itself so a backend that ignores the filter cannot leak long videos into the rail.
  return rows.filter((r) => r.is_short === true).map(toClassified);
}
