import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { GLOSSARY_SELECT, mapGlossaryEntries, type GlossaryRow } from "../lib/mapper";
import * as mock from "../mock";
import type { GlossaryEntry } from "../types";

/** Approved fan glossary entries, oldest first so the deck grows at the end (RLS hides pending ones from the anon client). */
export async function getGlossaryEntries(): Promise<GlossaryEntry[]> {
  "use cache";
  cacheTag(TAGS.glossary);
  cacheLife("hours"); // invalidated by its tag on every write; "minutes" re-rendered pages every 60 s (ADR-019)
  if (!isSupabaseConfigured) return mock.glossaryEntries;
  const rows = check<GlossaryRow[]>(
    await publicClient().from("glossary_entries").select(GLOSSARY_SELECT).eq("approved", true).order("created_at", { ascending: true }).limit(200),
    "glossary_entries",
  );
  return mapGlossaryEntries(rows);
}

/** The viewer's own entries waiting for review (RLS lets authors read them). Dynamic (session): render under <Suspense>, never cache. */
export async function getMyPendingGlossaryEntries(userId: string): Promise<GlossaryEntry[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await serverClient();
  const { data } = await supabase
    .from("glossary_entries")
    .select(GLOSSARY_SELECT)
    .eq("author_id", userId)
    .eq("approved", false)
    .order("created_at", { ascending: false })
    .limit(5);
  return mapGlossaryEntries((data ?? []) as unknown as GlossaryRow[]);
}
