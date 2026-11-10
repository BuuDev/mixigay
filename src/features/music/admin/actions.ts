"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";
import { songPlatform } from "../lib/song-url";
import { fetchSongCover } from "../server/song-cover";

export async function setSongApproved(id: string, approved: boolean) {
  const supabase = await adminDb();
  fail("setSongApproved", (await supabase.from("fan_songs").update({ approved }).eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.songs);
}

export async function deleteSong(id: string) {
  const supabase = await adminDb();
  fail("deleteSong", (await supabase.from("fan_songs").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.songs);
}

/** Re-fetch a song's cover from its platform (e.g. the fan changed the artwork). */
export async function refetchSongCover(id: string) {
  const supabase = await adminDb();
  const songId = z.uuid().parse(id);
  const { data, error } = await supabase.from("fan_songs").select("url").eq("id", songId).single();
  fail("refetchSongCover", error);
  const url = (data as { url: string }).url;
  const platform = songPlatform(url);
  const thumbnail_url = platform ? await fetchSongCover(url, platform) : null;
  fail("refetchSongCover", (await supabase.from("fan_songs").update({ thumbnail_url }).eq("id", songId)).error);
  updateTag(TAGS.songs);
}
