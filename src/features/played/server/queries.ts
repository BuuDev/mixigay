import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapPlayed, type PlayedGameRow } from "../lib/mapper";
import * as mock from "../mock";
import type { PlayedGame } from "../types";

export async function getPlayedGames(): Promise<PlayedGame[]> {
  "use cache";
  cacheTag(TAGS.played);
  cacheLife("days");
  if (!isSupabaseConfigured) return mock.playedGames;
  const rows = check<PlayedGameRow[]>(
    await publicClient().from("played_games").select("*").order("last_played", { ascending: false }),
    "played_games",
  );
  return rows.map(mapPlayed);
}
