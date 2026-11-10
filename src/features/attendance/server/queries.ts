import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicClient } from "@/server/supabase/public";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import * as mock from "../mock";

/** Signed-in fans who tapped "có mặt" on a Vietnam day ("YYYY-MM-DD"). Guests are never counted. */
export async function getAttendanceCount(dateVn: string): Promise<number> {
  "use cache";
  cacheTag(TAGS.attendance);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return mock.attendanceCount;
  // A side counter on the home page: a failed read shows "no one yet" instead of breaking the page.
  const { data, error } = await publicClient().rpc("attendance_count", { p_date: dateVn });
  if (error) console.error("attendance_count", error.message);
  return typeof data === "number" ? data : 0;
}

/** Whether the user tapped on that Vietnam day. Dynamic (session): render under <Suspense>. */
export async function getMyAttendance(userId: string, dateVn: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = await serverClient();
  const { data } = await supabase.from("attendance").select("date_vn").match({ date_vn: dateVn, user_id: userId }).maybeSingle();
  return Boolean(data);
}

/**
 * The viewer's own attendance days ("YYYY-MM-DD", oldest first) for the personal
 * streak. RLS (`attendance_read_own`) returns only the caller's rows; the user id
 * filter is belt and braces. Dynamic (session): render under <Suspense>.
 * A failed read gives no streak rather than breaking the block.
 */
export async function getMyAttendanceDates(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await serverClient();
  // One bounded read: the newest 1000 nights (~3–4 years of streams) are far more than any
  // badge needs (top tier is 100), and the list is what the client streak panel receives.
  const { data, error } = await supabase.from("attendance").select("date_vn").eq("user_id", userId).order("date_vn", { ascending: false }).limit(1000);
  if (error) {
    console.error("my attendance dates", error.message);
    return [];
  }
  const dates: string[] = [];
  for (const r of (data ?? []) as { date_vn: unknown }[]) if (typeof r.date_vn === "string") dates.push(r.date_vn.slice(0, 10));
  return dates.reverse(); // oldest first, as before
}
