"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";

export async function setFanArtApproved(id: string, approved: boolean) {
  const supabase = await adminDb();
  fail("setFanArtApproved", (await supabase.from("fan_art").update({ approved }).eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.fanArt);
}

export async function deleteFanArt(id: string) {
  const supabase = await adminDb();
  fail("deleteFanArt", (await supabase.from("fan_art").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.fanArt);
}

