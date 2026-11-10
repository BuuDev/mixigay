"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";

export async function setGlossaryApproved(id: string, approved: boolean) {
  const supabase = await adminDb();
  const { error } = await supabase.from("glossary_entries").update({ approved }).eq("id", z.uuid().parse(id));
  // block_banned_approval(): a banned / shadow-banned author's entry can never be published.
  if (error?.message.includes("author_banned")) throw new Error("Tác giả mục từ này đang bị cấm: bỏ cấm trước rồi mới duyệt được.");
  // glossary_term_live: one approved entry per term (ignoring case and diacritics).
  if (error?.code === "23505") throw new Error("Đã có một mục từ cùng tên được duyệt: gỡ duyệt mục cũ hoặc xóa mục trùng này.");
  fail("setGlossaryApproved", error);
  updateTag(TAGS.glossary);
}

export async function deleteGlossaryEntry(id: string) {
  const supabase = await adminDb();
  fail("deleteGlossaryEntry", (await supabase.from("glossary_entries").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.glossary);
}
