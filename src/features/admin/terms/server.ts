import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { adminClient } from "@/server/supabase/admin";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import type { ExtraTerm } from "@/shared/lib/moderation/screen";
import { isTermCategory } from "./lib/terms";

/**
 * Admin-managed blocked terms (public.blocked_terms) for screenText(fields, terms).
 * Service-role read on purpose (docs/07-conventions.md, service-role exceptions): the list
 * is not readable by fans, so spammers cannot look up what is filtered. Fails open to the
 * built-in lexicon, so a DB hiccup never stops fans from posting.
 */
export async function getBlockedTerms(): Promise<ExtraTerm[]> {
  "use cache";
  cacheTag(TAGS.blockedTerms);
  cacheLife("minutes");
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data, error } = await adminClient().from("blocked_terms").select("term,category");
  if (error) {
    console.error("getBlockedTerms", error.message);
    return [];
  }
  return ((data ?? []) as { term: string; category: string }[]).flatMap((r) => (isTermCategory(r.category) ? [{ term: r.term, category: r.category }] : []));
}
