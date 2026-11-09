"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/data";
import { reclassifyAll } from "@/lib/jobs/classifier";
import { serverClient } from "@/lib/supabase/server";

// Every action re-checks admin rights; RLS (is_admin()) enforces it again in Postgres.

async function db() {
  await requireAdmin();
  return serverClient();
}

function fail(what: string, error: { message: string } | null) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const optional = (fd: FormData, key: string) => str(fd, key) || null;
const slug = z.string().regex(/^[a-z0-9-]+$/, "slug chỉ gồm a-z, 0-9, dấu gạch");

// ----- Schedule -----
export async function addSlot(fd: FormData) {
  const input = z
    .object({
      day_of_week: z.coerce.number().int().min(0).max(6),
      time_vn: z.string().regex(/^\d{2}:\d{2}$/),
      title: z.string().min(1).max(120),
      game_slug: slug.nullable(),
      note: z.string().max(200).nullable(),
    })
    .parse({ day_of_week: str(fd, "day"), time_vn: str(fd, "time"), title: str(fd, "title"), game_slug: optional(fd, "game"), note: optional(fd, "note") });
  const supabase = await db();
  fail("addSlot", (await supabase.from("schedule_slots").insert(input)).error);
  updateTag(TAGS.schedule);
}

export async function deleteSlot(id: string) {
  const supabase = await db();
  fail("deleteSlot", (await supabase.from("schedule_slots").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.schedule);
}

// ----- Videos -----
export async function setVideoGame(fd: FormData) {
  const videoId = z.string().min(1).max(20).parse(str(fd, "videoId"));
  const game = optional(fd, "game");
  const supabase = await db();
  fail("setVideoGame", (await supabase.from("videos").update({ manual_game_slug: game ? slug.parse(game) : null }).eq("video_id", videoId)).error);
  updateTag(TAGS.videos);
}

// ----- Games & keywords -----
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
  const supabase = await db();
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
  const supabase = await db();
  fail("deleteGame", (await supabase.from("games").delete().eq("slug", slug.parse(gameSlug))).error);
  await reclassifyAll(supabase);
  updateTag(TAGS.games);
  updateTag(TAGS.videos);
  updateTag(TAGS.played);
}

export async function mapPlaylist(fd: FormData) {
  const playlistId = z.string().min(1).max(64).parse(str(fd, "playlistId"));
  const game = optional(fd, "game");
  const supabase = await db();
  fail("mapPlaylist", (await supabase.from("playlist_game_map").update({ game_slug: game ? slug.parse(game) : null }).eq("playlist_id", playlistId)).error);
  // Membership of a newly mapped playlist is fetched by the next sync-videos run.
  await reclassifyAll(supabase);
  updateTag(TAGS.videos);
}

// ----- Suggestions -----
export async function updateSuggestion(fd: FormData) {
  const input = z
    .object({
      id: z.uuid(),
      status: z.enum(["pending", "played", "rejected"]),
      linked_game_slug: slug.nullable(),
      hidden: z.boolean(),
    })
    .parse({ id: str(fd, "id"), status: str(fd, "status"), linked_game_slug: optional(fd, "game"), hidden: fd.get("hidden") === "on" });
  const { id, ...patch } = input;
  const supabase = await db();
  fail("updateSuggestion", (await supabase.from("suggestions").update(patch).eq("id", id)).error);
  updateTag(TAGS.suggestions);
}

export async function deleteSuggestion(id: string) {
  const supabase = await db();
  fail("deleteSuggestion", (await supabase.from("suggestions").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.suggestions);
}

// ----- Played games -----
export async function savePlayed(fd: FormData) {
  const input = z
    .object({
      game_slug: slug,
      status: z.enum(["playing", "finished", "dropped"]),
      sessions: z.coerce.number().int().min(0),
      last_played: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    })
    .parse({ game_slug: str(fd, "game"), status: str(fd, "status"), sessions: str(fd, "sessions") || "0", last_played: optional(fd, "last_played") });
  const supabase = await db();
  fail("savePlayed", (await supabase.from("played_games").upsert(input, { onConflict: "game_slug" })).error);
  updateTag(TAGS.played);
}

export async function deletePlayed(gameSlug: string) {
  const supabase = await db();
  fail("deletePlayed", (await supabase.from("played_games").delete().eq("game_slug", slug.parse(gameSlug))).error);
  updateTag(TAGS.played);
}
