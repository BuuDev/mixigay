import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapFanSong, type FanSongRow } from "../lib/mapper";
import * as mock from "../mock";
import type { FanSong } from "../types";

/** Approved fan songs, newest first (RLS hides pending ones from the anon client). */
export async function getFanSongs(): Promise<FanSong[]> {
  "use cache";
  cacheTag(TAGS.songs);
  cacheLife("hours");
  if (!isSupabaseConfigured) return mock.fanSongs;
  const rows = check<FanSongRow[]>(
    await publicClient()
      .from("fan_songs")
      .select("id,title,artist,url,note,approved,created_at,upvotes")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(200),
    "fan_songs",
  );
  return rows.map(mapFanSong).filter((s): s is FanSong => s !== null);
}

/** Song ids the user has upvoted. Dynamic (session): render under <Suspense>. */
export async function getMySongVoteIds(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await serverClient();
  const { data } = await supabase.from("fan_song_votes").select("song_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.song_id as string);
}
