"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str, optional, slug } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";

export async function savePlayed(fd: FormData) {
  const input = z
    .object({
      game_slug: slug,
      status: z.enum(["playing", "finished", "dropped"]),
      sessions: z.coerce.number().int().min(0),
      last_played: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    })
    .parse({ game_slug: str(fd, "game"), status: str(fd, "status"), sessions: str(fd, "sessions") || "0", last_played: optional(fd, "last_played") });
  const supabase = await adminDb();
  fail("savePlayed", (await supabase.from("played_games").upsert(input, { onConflict: "game_slug" })).error);
  updateTag(TAGS.played);
}

export async function deletePlayed(gameSlug: string) {
  const supabase = await adminDb();
  fail("deletePlayed", (await supabase.from("played_games").delete().eq("game_slug", slug.parse(gameSlug))).error);
  updateTag(TAGS.played);
}
