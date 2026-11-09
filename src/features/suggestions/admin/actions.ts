"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str, optional, slug } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";

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
  fail("updateSuggestion", (await supabase.from("suggestions").update(patch).eq("id", id)).error);
  updateTag(TAGS.suggestions);
}

export async function deleteSuggestion(id: string) {
  const supabase = await adminDb();
  fail("deleteSuggestion", (await supabase.from("suggestions").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.suggestions);
}
