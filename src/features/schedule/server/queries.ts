import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapOverrides, mapSlot, type ScheduleOverrideRow, type ScheduleSlotRow } from "../lib/mapper";
import * as mock from "../mock";
import type { ScheduleOverride, ScheduleSlot } from "../types";

export async function getSchedule(): Promise<ScheduleSlot[]> {
  "use cache";
  cacheTag(TAGS.schedule);
  cacheLife("days");
  if (!isSupabaseConfigured) return mock.schedule;
  const rows = check<ScheduleSlotRow[]>(
    await publicClient().from("schedule_slots").select("*").eq("active", true).order("day_of_week").order("time_vn"),
    "schedule_slots",
  );
  return rows.map(mapSlot);
}

/**
 * One-day exceptions (day off, moved time, extra stream). All rows: the table is
 * tiny, past dates keep "the previous stream" (countdown ring) right, and the
 * schedule logic matches by date so old rows are harmless.
 */
export async function getScheduleOverrides(): Promise<ScheduleOverride[]> {
  "use cache";
  cacheTag(TAGS.schedule);
  cacheLife("days");
  if (!isSupabaseConfigured) return mock.overrides;
  const rows = check<ScheduleOverrideRow[]>(await publicClient().from("schedule_overrides").select("*").order("date_vn"), "schedule_overrides");
  return mapOverrides(rows);
}
