"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";

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
