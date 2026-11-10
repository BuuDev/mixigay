import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapThemeWindow, type ThemeScheduleRow } from "../lib/mapper";
import type { ThemeWindow } from "../types";

/** Every scheduled skin window. Which one is on is decided in the viewer's browser (Vietnam date), never at prerender. */
export async function getThemeSchedule(): Promise<ThemeWindow[]> {
  "use cache";
  cacheTag(TAGS.themes);
  cacheLife("hours");
  if (!isSupabaseConfigured) return [];
  const rows = check<ThemeScheduleRow[]>(
    await publicClient().from("theme_schedule").select("id,theme,label,starts_on,ends_on").order("starts_on", { ascending: false }),
    "theme_schedule",
  );
  return rows.map(mapThemeWindow).filter((w): w is ThemeWindow => w !== null);
}
