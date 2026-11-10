import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapTournament, TOURNAMENT_SELECT, type TournamentRow } from "../lib/mapper";
import * as mock from "../mock";
import type { Tournament } from "../types";

/** All tournaments with their results (admin-entered, public read). */
export async function getTournaments(): Promise<Tournament[]> {
  "use cache";
  cacheTag(TAGS.tournaments);
  cacheLife("hours");
  if (!isSupabaseConfigured) return mock.tournaments;
  const rows = check<TournamentRow[]>(
    await publicClient().from("tournaments").select(TOURNAMENT_SELECT).order("starts_on", { ascending: false, nullsFirst: true }).limit(200),
    "tournaments",
  );
  return rows.map(mapTournament).filter((t): t is Tournament => t !== null);
}
