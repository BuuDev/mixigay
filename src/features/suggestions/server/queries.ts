import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapSuggestion, SUGGESTION_SELECT, type SuggestionRow } from "../lib/mapper";
import * as mock from "../mock";
import type { Suggestion } from "../types";

export async function getSuggestions(): Promise<Suggestion[]> {
  "use cache";
  cacheTag(TAGS.suggestions);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return mock.suggestions;
  const rows = check<SuggestionRow[]>(
    await publicClient().from("suggestions").select(SUGGESTION_SELECT).order("upvotes", { ascending: false }).limit(500),
    "suggestions",
  );
  return rows.map(mapSuggestion);
}

/** Suggestion ids the user has upvoted. Dynamic (session): render under <Suspense>. */
export async function getMyVoteIds(userId: string): Promise<string[]> {
  const supabase = await serverClient();
  const { data } = await supabase.from("suggestion_votes").select("suggestion_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.suggestion_id as string);
}
