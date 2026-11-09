"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";

const Mode = z.enum(["ban", "shadow", "unban"]);

/**
 * Stops an abuser in one click (supabase/migrations/20261110090000_moderation.sql):
 * "ban" blocks posting, "shadow" lets them keep posting into a queue nobody sees.
 * Both hide everything they posted, withdraw their songs and votes, and reset their name.
 */
export async function moderateUser(userId: string, mode: "ban" | "shadow" | "unban") {
  const supabase = await adminDb();
  fail("moderateUser", (await supabase.rpc("moderate_user", { p_user: z.uuid().parse(userId), p_mode: Mode.parse(mode) })).error);
  updateTag(TAGS.suggestions);
  updateTag(TAGS.songs);
}

/** Replaces an offensive display name with "Fan ####". */
export async function resetDisplayName(userId: string) {
  const supabase = await adminDb();
  fail("resetDisplayName", (await supabase.rpc("reset_display_name", { p_user: z.uuid().parse(userId) })).error);
  updateTag(TAGS.suggestions);
  updateTag(TAGS.songs);
}
