"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";
import { normalizeTerm, TermInput } from "./lib/terms";

/** Adds a term every fan submission is screened against. Adding one that exists is a no-op. */
export async function addBlockedTerm(fd: FormData) {
  const supabase = await adminDb();
  const input = TermInput.parse({ term: str(fd, "term"), category: str(fd, "category") });
  const { error } = await supabase.from("blocked_terms").insert(input);
  if (error?.code !== "23505") fail("addBlockedTerm", error); // 23505: already listed
  updateTag(TAGS.blockedTerms);
}

export async function deleteBlockedTerm(term: string) {
  const supabase = await adminDb();
  const key = z.string().min(1).max(60).parse(normalizeTerm(term));
  fail("deleteBlockedTerm", (await supabase.from("blocked_terms").delete().eq("term", key)).error);
  updateTag(TAGS.blockedTerms);
}
