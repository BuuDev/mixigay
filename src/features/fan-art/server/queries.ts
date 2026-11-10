import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapFanArt, type FanArtRow } from "../lib/mapper";
import * as mock from "../mock";
import type { FanArtItem } from "../types";

/** Approved fan art items, newest first (falls back to starter gallery if empty or in mock mode). */
export async function getFanArt(): Promise<FanArtItem[]> {
  "use cache";
  cacheTag(TAGS.fanArt);
  cacheLife("hours");
  if (!isSupabaseConfigured) return mock.fanArtItems;
  const rows = check<FanArtRow[]>(
    await publicClient()
      .from("fan_art")
      .select("id,title,artist,drive_url,drive_file_id,note,approved,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(120),
    "fan_art",
  );
  const mapped = rows.map(mapFanArt).filter((a): a is FanArtItem => a !== null);
  return mapped.length > 0 ? mapped : mock.fanArtItems;
}

