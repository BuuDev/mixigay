import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { classifyVideo, UNCLASSIFIED } from "../lib/classify";
import { mapGame, mapVideo, type GameRow, type VideoRow } from "../lib/mapper";
import * as mock from "../mock";
import type { ClassifiedVideo, Game } from "../types";

export async function getGames(): Promise<Game[]> {
  "use cache";
  cacheTag(TAGS.games);
  cacheLife("days");
  if (!isSupabaseConfigured) return mock.games;
  const rows = check<GameRow[]>(
    await publicClient().from("games").select("*, game_keywords(keyword)").order("sort_order").order("name"),
    "games",
  );
  return rows.map(mapGame);
}

export async function getVideos(): Promise<ClassifiedVideo[]> {
  "use cache";
  cacheTag(TAGS.videos, TAGS.games);
  cacheLife("hours");
  if (!isSupabaseConfigured) {
    return mock.videos.map((v) => ({ ...v, gameSlug: classifyVideo(v, mock.games) }));
  }
  // PostgREST caps a response at 1000 rows, so page through.
  const rows: VideoRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const page = check<VideoRow[]>(
      await publicClient()
        .from("videos")
        .select("video_id,title,published_at,duration_seconds,view_count,thumbnail_url,was_live,playlist_ids,manual_game_slug,auto_game_slug")
        .neq("live_state", "upcoming")
        .order("published_at", { ascending: false })
        .range(from, from + PAGE - 1),
      "videos",
    );
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows.map((r) => {
    const { autoGameSlug, ...video } = mapVideo(r);
    return { ...video, gameSlug: video.manualGameSlug ?? autoGameSlug ?? UNCLASSIFIED };
  });
}
