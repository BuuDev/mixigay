// Data access for pages. Public reads are cached ("use cache") and tagged so
// cron jobs and admin actions can refresh them; see docs/02-architecture.md.
// Without Supabase settings every getter serves src/lib/mock-data.ts.
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { classifyVideo, UNCLASSIFIED } from "./classify";
import { isSupabaseConfigured } from "./env";
import * as mock from "./mock-data";
import { mapGame, mapLiveStatus, mapPlayed, mapSlot, mapSuggestion, mapVideo } from "./supabase/map";
import { publicClient } from "./supabase/public";
import type { GameRow, LiveStatusRow, PlayedGameRow, ScheduleSlotRow, SuggestionRow, VideoRow } from "./supabase/rows";
import type { Game, LiveStatus, PlayedGame, ScheduleSlot, Suggestion, Video } from "./types";

export type ClassifiedVideo = Video & { gameSlug: string };

export const TAGS = {
  live: "live",
  schedule: "schedule",
  games: "games",
  videos: "videos",
  played: "played",
  suggestions: "suggestions",
} as const;

// The client is untyped (no generated Database type yet), so rows are asserted to
// the shapes in ./supabase/rows.ts. PostgREST returns many-to-one embeds as objects.
export function check<T>(result: { data: unknown; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Supabase ${what}: ${result.error.message}`);
  return result.data as T;
}

export async function getLiveStatus(): Promise<LiveStatus> {
  "use cache";
  cacheTag(TAGS.live);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return mock.liveStatus;
  const row = check<LiveStatusRow>(await publicClient().from("live_status").select("*").single(), "live_status");
  return mapLiveStatus(row);
}

export async function getSchedule(): Promise<ScheduleSlot[]> {
  "use cache";
  cacheTag(TAGS.schedule);
  cacheLife("days");
  if (!isSupabaseConfigured) return mock.schedule;
  const rows = check<ScheduleSlotRow[]>(
    await publicClient().from("schedule_slots").select("*").eq("active", true).order("day_of_week").order("time_vn"),
    "schedule_slots",
  );
  return rows.map(mapSlot);
}

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

export async function getPlayedGames(): Promise<PlayedGame[]> {
  "use cache";
  cacheTag(TAGS.played);
  cacheLife("days");
  if (!isSupabaseConfigured) return mock.playedGames;
  const rows = check<PlayedGameRow[]>(
    await publicClient().from("played_games").select("*").order("last_played", { ascending: false }),
    "played_games",
  );
  return rows.map(mapPlayed);
}

export const SUGGESTION_SELECT =
  "id,name,source,url,reason,status,linked_game_slug,steam_app_id,steam_data,upvotes,hidden,created_at,profiles(display_name,avatar_url)";

export async function getSuggestions(): Promise<Suggestion[]> {
  "use cache";
  cacheTag(TAGS.suggestions);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return mock.suggestions;
  const rows = check<SuggestionRow[]>(
    await publicClient()
      .from("suggestions")
      .select(SUGGESTION_SELECT)
      .order("upvotes", { ascending: false })
      .limit(500),
    "suggestions",
  );
  return rows.map(mapSuggestion);
}
