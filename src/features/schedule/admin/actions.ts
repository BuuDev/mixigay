"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str, optional, slug } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";

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
  const supabase = await adminDb();
  fail("addSlot", (await supabase.from("schedule_slots").insert(input)).error);
  updateTag(TAGS.schedule);
}

export async function deleteSlot(id: string) {
  const supabase = await adminDb();
  fail("deleteSlot", (await supabase.from("schedule_slots").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.schedule);
}
