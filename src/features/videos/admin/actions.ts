"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str, optional, slug } from "@/features/admin/server/admin-db";
import { reclassifyAll } from "../server/classifier";
import { TAGS } from "@/shared/lib/cache-tags";

export async function setVideoGame(fd: FormData) {
  const videoId = z.string().min(1).max(20).parse(str(fd, "videoId"));
  const game = optional(fd, "game");
  const supabase = await adminDb();
  fail(
    "setVideoGame",
    (
      await supabase
        .from("videos")
        .update({ manual_game_slug: game ? slug.parse(game) : null })
        .eq("video_id", videoId)
    ).error,
  );
  updateTag(TAGS.videos);
}

export async function saveGame(fd: FormData) {
  const input = z
    .object({ slug, name: z.string().min(1).max(80), is_vlog: z.boolean(), sort_order: z.coerce.number().int() })
    .parse({ slug: str(fd, "slug"), name: str(fd, "name"), is_vlog: fd.get("is_vlog") === "on", sort_order: str(fd, "sort_order") || "0" });
  const keywords = [
    ...new Set(
      str(fd, "keywords")
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const supabase = await adminDb();
  fail("saveGame", (await supabase.from("games").upsert(input, { onConflict: "slug" })).error);
  fail("clearKeywords", (await supabase.from("game_keywords").delete().eq("game_slug", input.slug)).error);
  if (keywords.length) {
    fail("insertKeywords", (await supabase.from("game_keywords").insert(keywords.map((keyword) => ({ game_slug: input.slug, keyword })))).error);
  }
  await reclassifyAll(supabase);
  updateTag(TAGS.games);
  updateTag(TAGS.videos);
}

export async function deleteGame(gameSlug: string) {
  const supabase = await adminDb();
  fail("deleteGame", (await supabase.from("games").delete().eq("slug", slug.parse(gameSlug))).error);
  await reclassifyAll(supabase);
  updateTag(TAGS.games);
  updateTag(TAGS.videos);
  updateTag(TAGS.played);
}

export async function mapPlaylist(fd: FormData) {
  const playlistId = z.string().min(1).max(64).parse(str(fd, "playlistId"));
  const game = optional(fd, "game");
  const supabase = await adminDb();
  fail(
    "mapPlaylist",
    (
      await supabase
        .from("playlist_game_map")
        .update({ game_slug: game ? slug.parse(game) : null })
        .eq("playlist_id", playlistId)
    ).error,
  );
  // Membership of a newly mapped playlist is fetched by the next sync-videos run.
  await reclassifyAll(supabase);
  updateTag(TAGS.videos);
}
