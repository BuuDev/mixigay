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
