import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { YtVideo } from "@/server/youtube/client";
import { toVideoColumns } from "../lib/video-row";
import { loadClassifier } from "./classifier";

/**
 * Upserts videos.list items with the same columns and auto classification as poll-live:
 * toVideoColumns (state, chapters, duration…) plus auto_game_slug from the current
 * keywords and the playlist membership already stored. The admin's manual tag is never touched.
 */
export async function upsertYtVideos(db: SupabaseClient, items: YtVideo[], now: Date): Promise<number> {
  if (!items.length) return 0;
  const existingRes = await db
    .from("videos")
    .select("video_id, playlist_ids")
    .in(
      "video_id",
      items.map((v) => v.id),
    );
  if (existingRes.error) throw new Error(`videos: ${existingRes.error.message}`);
  const playlists = new Map(((existingRes.data ?? []) as { video_id: string; playlist_ids: string[] }[]).map((r) => [r.video_id, r.playlist_ids]));
  const classify = await loadClassifier(db);
  const rows = items.map((v) => {
    const cols = toVideoColumns(v, now);
    return { ...cols, auto_game_slug: classify({ title: cols.title, playlistIds: playlists.get(v.id) }) };
  });
  const up = await db.from("videos").upsert(rows, { onConflict: "video_id" });
  if (up.error) throw new Error(`videos upsert: ${up.error.message}`);
  return rows.length;
}
