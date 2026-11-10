import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { thumbnailFor } from "@/shared/lib/links";
import { classifyVideo, UNCLASSIFIED } from "../lib/classify";
import { gameCovers, type GameCover } from "../lib/game-cover";
import { selectVideos, videoTabs, type VideoSort, type VideoTab } from "../lib/video-query";
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

/** List columns without chapters: a card never shows them. */
const LIST_COLUMNS = "video_id,title,published_at,duration_seconds,view_count,thumbnail_url,was_live,playlist_ids,manual_game_slug,auto_game_slug,is_short";

/**
 * One screen of /video: tabs with counts, the cards for the query and the selected game's
 * cover. Cached per (game, sort, limit). With Supabase the filter, sort and page cut run in
 * the database (videos.game_slug + partial indexes, migration 20261111140000): one small
 * indexed query instead of reading the whole channel for every filter click.
 */
export async function getVideoPage(game: string, sort: VideoSort, limit: number) {
  "use cache";
  cacheTag(TAGS.videos, TAGS.games);
  cacheLife("hours");
  if (!isSupabaseConfigured) {
    const [videos, games] = await Promise.all([getVideos(), getGames()]);
    const { items, total } = selectVideos(videos, { game, sort, limit });
    const cover = game !== "all" ? (gameCovers(videos, games).get(game) ?? null) : null;
    return { tabs: videoTabs(videos, games), items, total, cover, games };
  }
  const db = publicClient();
  let list = db.from("videos").select(LIST_COLUMNS).eq("is_short", false).neq("live_state", "upcoming");
  if (game !== "all") list = list.eq("game_slug", game);
  list =
    sort === "views"
      ? list.order("view_count", { ascending: false }).order("published_at", { ascending: false })
      : list.order("published_at", { ascending: false });
  const [games, counts, rows, cover] = await Promise.all([
    getGames(),
    getVideoCounts(),
    list.limit(limit),
    game !== "all" && game !== UNCLASSIFIED ? getGameCover(game) : null,
  ]);
  const items = check<VideoRow[]>(rows, "video page").map(toClassified);
  const tabs = tabsFromCounts(counts, games);
  const total = game === "all" ? (tabs[0]?.count ?? 0) : (counts.get(game) ?? 0);
  return { tabs, items, total, cover, games };
}

/** Videos per game_slug (Shorts and upcoming placeholders excluded). */
async function getVideoCounts(): Promise<Map<string, number>> {
  const rows = check<{ game_slug: string; n: number }[]>(await publicClient().rpc("video_game_counts"), "video counts");
  return new Map(rows.map((r) => [r.game_slug, Number(r.n)]));
}

function tabsFromCounts(counts: Map<string, number>, games: readonly Game[]): VideoTab[] {
  let all = 0;
  for (const n of counts.values()) all += n;
  return [
    { slug: "all", label: "Tất cả", count: all },
    ...games.map((g) => ({ slug: g.slug, label: g.name, count: counts.get(g.slug) ?? 0 })),
    { slug: UNCLASSIFIED, label: "Chưa phân loại", count: counts.get(UNCLASSIFIED) ?? 0 },
  ].filter((t) => t.slug === "all" || t.count > 0);
}

/** Same rule as gameCovers(): the newest past stream of the game, else its newest upload. */
async function getGameCover(game: string): Promise<GameCover | null> {
  const rows = check<VideoRow[]>(
    await publicClient()
      .from("videos")
      .select(LIST_COLUMNS)
      .eq("game_slug", game)
      .eq("is_short", false)
      .not("thumbnail_url", "is", null)
      .order("was_live", { ascending: false })
      .order("published_at", { ascending: false })
      .order("video_id", { ascending: true })
      .limit(1),
    "game cover",
  );
  const v = rows[0] ? toClassified(rows[0]) : null;
  return v?.thumbnailUrl ? { thumbnailUrl: v.thumbnailUrl, videoId: v.videoId, title: v.title, publishedAt: v.publishedAt, wasLive: v.wasLive } : null;
}

/** The newest past streams with their chapters, for the timeline on /video (a few rows, not the channel). */
export async function getRecentStreams(limit = 8): Promise<ClassifiedVideo[]> {
  "use cache";
  cacheTag(TAGS.videos, TAGS.games);
  cacheLife("hours");
  if (!isSupabaseConfigured) return (await getVideos()).filter((v) => v.wasLive).slice(0, limit);
  const rows = check<VideoRow[]>(
    await publicClient()
      .from("videos")
      .select(VIDEO_COLUMNS)
      .eq("was_live", true)
      .neq("live_state", "upcoming")
      .order("published_at", { ascending: false })
      .limit(limit),
    "recent streams",
  );
  return rows.map(toClassified);
}
