"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";

export async function setWallApproved(id: string, approved: boolean) {
  const supabase = await adminDb();
  const { error } = await supabase.from("wall_messages").update({ approved }).eq("id", z.uuid().parse(id));
  // block_banned_approval(): a banned / shadow-banned author's message can never be published.
  if (error?.message.includes("author_banned")) throw new Error("Tác giả lời nhắn này đang bị cấm: bỏ cấm trước rồi mới duyệt được.");
  fail("setWallApproved", error);
  updateTag(TAGS.wall);
}

export async function deleteWallMessage(id: string) {
  const supabase = await adminDb();
  fail("deleteWallMessage", (await supabase.from("wall_messages").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.wall);
}
