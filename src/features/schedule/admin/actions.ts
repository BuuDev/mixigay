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

const dateVn = z.iso.date(); // "YYYY-MM-DD", calendar-valid

/** Add or replace the one-day exception for a Vietnam date (date_vn is the key). */
export async function saveOverride(fd: FormData) {
  const input = z
    .object({
      date_vn: dateVn,
      cancelled: z.boolean(),
      time_vn: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .nullable(),
      title: z.string().max(120).nullable(),
      note: z.string().max(200).nullable(),
    })
    .refine((o) => o.cancelled || o.time_vn || o.title || o.note, "Chọn nghỉ, hoặc nhập giờ / tiêu đề / ghi chú")
    .parse({
      date_vn: str(fd, "date"),
      cancelled: fd.get("cancelled") === "on",
      time_vn: optional(fd, "time"),
      title: optional(fd, "title"),
      note: optional(fd, "note"),
    });
  // A cancelled day has no stream: drop time/title so the row cannot read as "moved".
  const row = input.cancelled ? { ...input, time_vn: null, title: null } : input;
  const supabase = await adminDb();
  fail("saveOverride", (await supabase.from("schedule_overrides").upsert(row, { onConflict: "date_vn" })).error);
  updateTag(TAGS.schedule);
}

export async function deleteOverride(date: string) {
  const supabase = await adminDb();
  fail("deleteOverride", (await supabase.from("schedule_overrides").delete().eq("date_vn", dateVn.parse(date))).error);
  updateTag(TAGS.schedule);
}
