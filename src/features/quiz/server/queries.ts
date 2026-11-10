import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapQuizLinks, QUIZ_LINK_SELECT, type QuizLinkRow } from "../lib/mapper";
import type { QuizLink } from "../types";

/**
 * Approved quiz links, newest first (RLS hides pending ones from the anon client).
 * Mock mode has none on purpose: inventing links (or a "played" moment) would put
 * words in anh Độ's mouth.
 */
export async function getQuizLinks(): Promise<QuizLink[]> {
  "use cache";
  cacheTag(TAGS.quiz);
  cacheLife("hours"); // invalidated by its tag on every write; "minutes" re-rendered pages every 60 s (ADR-019)
  if (!isSupabaseConfigured) return [];
  const rows = check<QuizLinkRow[]>(
    await publicClient().from("quiz_links").select(QUIZ_LINK_SELECT).eq("approved", true).order("created_at", { ascending: false }).limit(120),
    "quiz_links",
  );
  return mapQuizLinks(rows);
}

/** The viewer's own links waiting for review (RLS lets authors read them). Dynamic (session): render under <Suspense>, never cache. */
export async function getMyPendingQuizLinks(userId: string): Promise<QuizLink[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await serverClient();
  const { data } = await supabase
    .from("quiz_links")
    .select(QUIZ_LINK_SELECT)
    .eq("author_id", userId)
    .eq("approved", false)
    .order("created_at", { ascending: false })
    .limit(5);
  return mapQuizLinks((data ?? []) as unknown as QuizLinkRow[]);
}
