"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str, optional, slug } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";
import { adminClient } from "@/server/supabase/admin";
import { deleteArt, mirrorSteamArt } from "../server/game-art";
import { parseThumbnailReview } from "../lib/image-policy";

export async function updateSuggestion(fd: FormData) {
  const input = z
    .object({
      id: z.uuid(),
      status: z.enum(["pending", "played", "rejected"]),
      linked_game_slug: slug.nullable(),
      hidden: z.boolean(),
      approved: z.boolean(),
    })
    .parse({
      id: str(fd, "id"),
      status: str(fd, "status"),
      linked_game_slug: optional(fd, "game"),
      hidden: fd.get("hidden") === "on",
      approved: fd.get("approved") === "on",
    });
  const { id, ...patch } = input;
  const supabase = await adminDb();
  const { data: before } = await supabase.from("suggestions").select("approved,steam_app_id,thumbnail_path").eq("id", id).maybeSingle();
  fail("updateSuggestion", (await supabase.from("suggestions").update(patch).eq("id", id)).error);
  // Approving a Steam suggestion without stored art: copy the Steam header now (≤ 5 s,
  // never throws; skipped where Steam is unreachable, e.g. a VN dev machine).
  if (patch.approved && !before?.approved && before?.steam_app_id && !before.thumbnail_path) {
    const result = await mirrorSteamArt(adminClient(), id);
    if ("skipped" in result) console.warn("updateSuggestion mirrorSteamArt", id, result.skipped);
  }
  updateTag(TAGS.suggestions);
}

/** "Lưu ảnh Steam về": copy the Steam header image into our Storage. */
export async function mirrorSuggestionArt(id: string) {
  await adminDb();
  const result = await mirrorSteamArt(adminClient(), z.uuid().parse(id));
  updateTag(TAGS.suggestions);
  if ("skipped" in result) throw new Error(`Không lưu được ảnh Steam: ${result.skipped}`);
}

/** "Gỡ ảnh" / "Gỡ ảnh + chặn vĩnh viễn": clears thumbnail_path, deletes the object, optionally bans its hashes. */
export async function removeSuggestionArt(id: string, ban: boolean) {
  const suggestionId = z.uuid().parse(id);
  const supabase = await adminDb();
  const { data: row, error } = await supabase.from("suggestions").select("thumbnail_path,suggestion_art_reviews(review)").eq("id", suggestionId).maybeSingle();
  fail("removeSuggestionArt", error);
  if (!row) return;
  if (ban) {
    const review = parseThumbnailReview((row.suggestion_art_reviews as { review?: unknown } | null)?.review);
    if (!review) throw new Error("removeSuggestionArt: không có mã băm của ảnh này để chặn");
    const hashes = [...new Set([review.sha256, review.originalSha256])].map((sha256) => ({ sha256, reason: `gỡ ở /admin/de-xuat (${suggestionId})` }));
    // Admin's own session: banned_image_hashes allows insert for is_admin() only.
    fail("removeSuggestionArt ban", (await supabase.from("banned_image_hashes").upsert(hashes, { onConflict: "sha256", ignoreDuplicates: true })).error);
  }
  fail("removeSuggestionArt clear", (await supabase.from("suggestions").update({ thumbnail_path: null }).eq("id", suggestionId)).error);
  // The review row is service-role written: clear it with the same client as the object.
  fail("removeSuggestionArt review", (await adminClient().from("suggestion_art_reviews").delete().eq("suggestion_id", suggestionId)).error);
  // Storage is written by the service role only (no storage policies for users).
  await deleteArt(adminClient(), row.thumbnail_path as string | null);
  updateTag(TAGS.suggestions);
}

export async function deleteSuggestion(id: string) {
  const suggestionId = z.uuid().parse(id);
  const supabase = await adminDb();
  const { data: row } = await supabase.from("suggestions").select("thumbnail_path").eq("id", suggestionId).maybeSingle();
  fail("deleteSuggestion", (await supabase.from("suggestions").delete().eq("id", suggestionId)).error);
  // Do not leave the stored image behind.
  if (row?.thumbnail_path) await deleteArt(adminClient(), row.thumbnail_path as string);
  updateTag(TAGS.suggestions);
}
