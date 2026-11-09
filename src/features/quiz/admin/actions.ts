"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";

export async function setQuizQuestionApproved(id: string, approved: boolean) {
  const supabase = await adminDb();
  fail("setQuizQuestionApproved", (await supabase.from("quiz_questions").update({ approved }).eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.quiz);
}

export async function deleteQuizQuestion(id: string) {
  const supabase = await adminDb();
  fail("deleteQuizQuestion", (await supabase.from("quiz_questions").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.quiz);
}

