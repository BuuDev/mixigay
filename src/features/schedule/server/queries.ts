import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapSlot, type ScheduleSlotRow } from "../lib/mapper";
import * as mock from "../mock";
import type { ScheduleSlot } from "../types";

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
