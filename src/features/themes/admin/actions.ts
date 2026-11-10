"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";
import { THEMES } from "../types";

const dateVn = z.iso.date(); // "YYYY-MM-DD", calendar-valid

export async function addThemeWindow(fd: FormData) {
  const input = z
    .object({
      theme: z.enum(THEMES),
      label: z.string().min(2).max(80),
      starts_on: dateVn,
      ends_on: dateVn,
    })
    .refine((o) => o.ends_on >= o.starts_on, { message: "Ngày tắt phải bằng hoặc sau ngày bật", path: ["ends_on"] })
    .parse({ theme: str(fd, "theme"), label: str(fd, "label"), starts_on: str(fd, "starts"), ends_on: str(fd, "ends") });
  const supabase = await adminDb();
  fail("addThemeWindow", (await supabase.from("theme_schedule").insert(input)).error);
  updateTag(TAGS.themes);
}

export async function deleteThemeWindow(id: string) {
  const supabase = await adminDb();
  fail("deleteThemeWindow", (await supabase.from("theme_schedule").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.themes);
}
