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
  cacheLife("hours"); // invalidated by its tag on every write; "minutes" re-rendered pages every 60 s (ADR-019)
  if (!isSupabaseConfigured) return mock.suggestions;
  // The most-voted AND the newest: ordering only by votes with a cap would drop a new
  // low-vote suggestion before the "Đang hot" ranking (lib/ranking.ts) ever saw it.
  const [top, fresh] = await Promise.all([
    publicClient().from("suggestions").select(SUGGESTION_SELECT).order("upvotes", { ascending: false }).limit(250),
    publicClient().from("suggestions").select(SUGGESTION_SELECT).order("created_at", { ascending: false }).limit(250),
  ]);
  const byId = new Map<string, SuggestionRow>();
  for (const r of [...check<SuggestionRow[]>(top, "suggestions"), ...check<SuggestionRow[]>(fresh, "suggestions")]) byId.set(r.id, r);
  return [...byId.values()].map(mapSuggestion);
}

/**
 * The viewer's own suggestions still waiting for review (RLS lets authors read their
 * unpublished rows). Hidden rows stay listed so a shadow ban is not visible. Dynamic (session): render under <Suspense>, never cache.
 */
export async function getMyPendingSuggestions(userId: string): Promise<Suggestion[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await serverClient();
  const { data } = await supabase
    .from("suggestions")
    .select(SUGGESTION_SELECT)
    .eq("author_id", userId)
    .eq("approved", false)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);
  return ((data ?? []) as unknown as SuggestionRow[]).map(mapSuggestion);
}

/** Suggestion ids the user has upvoted. Dynamic (session): render under <Suspense>. */
export async function getMyVoteIds(userId: string): Promise<string[]> {
  const supabase = await serverClient();
  const { data } = await supabase.from("suggestion_votes").select("suggestion_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.suggestion_id as string);
}
