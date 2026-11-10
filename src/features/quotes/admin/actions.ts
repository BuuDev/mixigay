"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";
import { quoteApproveError } from "../lib/errors";

export async function setQuoteApproved(id: string, approved: boolean) {
  const supabase = await adminDb();
  const { error } = await supabase.from("quotes").update({ approved }).eq("id", z.uuid().parse(id));
  // block_banned_approval() and the one-approved-quote-per-second unique index.
  const friendly = error && quoteApproveError(error);
  if (friendly) throw new Error(friendly);
  fail("setQuoteApproved", error);
  updateTag(TAGS.quotes);
}

export async function deleteQuote(id: string) {
  const supabase = await adminDb();
  fail("deleteQuote", (await supabase.from("quotes").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.quotes);
}
