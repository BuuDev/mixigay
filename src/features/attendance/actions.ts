"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import { attendanceDay } from "./lib/tonight";

export type AttendResult = { ok: true } | { ok: false; message: string };

/**
 * Sets the signed-in fan's "Tối nay tôi có mặt" for today (Vietnam day). Only
 * `date_vn` is written: RLS pins it to `public.today_vn()` and the user to
 * `auth.uid()`; shadow-banned taps succeed and are dropped by a trigger.
 * Guests never reach the DB (their tap stays in localStorage).
 */
export async function setAttendance(attend: boolean): Promise<AttendResult> {
  if (!z.boolean().safeParse(attend).success) return { ok: false, message: "Dữ liệu không hợp lệ." };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Vào Bộ Tộc (đăng nhập) để được tính vào số người hẹn." };
  const today = attendanceDay(new Date());
  const supabase = await serverClient();
  const { error } = attend
    ? await supabase.from("attendance").insert({ date_vn: today })
    : await supabase.from("attendance").delete().match({ date_vn: today, user_id: viewer.id });
  // 23505: already tapped today (double tap, second tab) — the wanted state holds.
  if (error && error.code !== "23505") {
    if (error.code === "42501") return { ok: false, message: "Tài khoản này đang bị khóa tương tác." };
    console.error("setAttendance", error);
    return { ok: false, message: "Có lỗi, thử lại sau." };
  }
  // High-frequency action: stale-while-revalidate so tap spam cannot keep emptying
  // the shared cache. The fan sees their own tap through useOptimistic.
  revalidateTag(TAGS.attendance, "max");
  return { ok: true };
}
