import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyVideo, UNCLASSIFIED } from "../lib/classify";
import { mapGame } from "../lib/mapper";
import type { GameRow } from "../lib/mapper";

export type AutoClassifier = (video: { title: string; playlistIds?: string[] }) => string | null;

/** Keyword + playlist classifier built from the current DB state. Manual tags are handled by the caller. */
export async function loadClassifier(db: SupabaseClient): Promise<AutoClassifier> {
  const [games, maps] = await Promise.all([
    db.from("games").select("*, game_keywords(keyword)"),
    db.from("playlist_game_map").select("playlist_id, game_slug").not("game_slug", "is", null),
  ]);
  if (games.error) throw new Error(`games: ${games.error.message}`);
  if (maps.error) throw new Error(`playlist_game_map: ${maps.error.message}`);
  const gameList = (games.data as GameRow[]).map(mapGame);
  const playlists = new Map((maps.data as { playlist_id: string; game_slug: string }[]).map((m) => [m.playlist_id, m.game_slug]));
  return (video) => {
    const slug = classifyVideo(video, gameList, playlists);
    return slug === UNCLASSIFIED ? null : slug;
  };
}

/**
 * Recomputes auto_game_slug for every video without a manual tag and writes
 * only the changes. Works with the service-role client or an admin's session
 * (set_auto_game is security invoker, so RLS limits it to admins).
 */
export async function reclassifyAll(db: SupabaseClient): Promise<number> {
  const classify = await loadClassifier(db);
  const changes: { video_id: string; auto_game_slug: string | null }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("videos")
      .select("video_id, title, playlist_ids, auto_game_slug")
      .is("manual_game_slug", null)
      .order("video_id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`videos: ${error.message}`);
    for (const v of data as { video_id: string; title: string; playlist_ids: string[]; auto_game_slug: string | null }[]) {
      const slug = classify({ title: v.title, playlistIds: v.playlist_ids });
      if (slug !== v.auto_game_slug) changes.push({ video_id: v.video_id, auto_game_slug: slug });
    }
    if (data.length < PAGE) break;
  }
  for (let i = 0; i < changes.length; i += 500) {
    const { error } = await db.rpc("set_auto_game", { p_rows: changes.slice(i, i + 500) });
    if (error) throw new Error(`set_auto_game: ${error.message}`);
  }
  return changes.length;
}
