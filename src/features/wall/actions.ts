"use server";

import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { screenText } from "@/shared/lib/moderation/screen";
import { WALL_MAX, WALL_MIN, wallLength } from "./lib/limits";

export type WallFormResult = { ok: true; message: string } | { ok: false; message: string } | null;

const REJECTED = "Nội dung không phù hợp với Góc Bộ Tộc. Viết lại lịch sự, không kèm quảng cáo nhé.";

const WallInput = z.object({
  body: z
    .string()
    .trim()
    .refine((s) => wallLength(s) >= WALL_MIN, "Lời nhắn ít nhất 2 ký tự.")
    .refine((s) => wallLength(s) <= WALL_MAX, `Lời nhắn tối đa ${WALL_MAX} ký tự.`),
});

export async function postWallMessage(_prev: WallFormResult, formData: FormData): Promise<WallFormResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Vào Bộ Tộc (đăng nhập) để viết lên tường." };

  const parsed = WallInput.safeParse({ body: formData.get("body") ?? "" });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { body } = parsed.data;
  // Generic on purpose: never tell a spammer which word tripped the filter.
  if (screenText([body]).verdict === "block") return { ok: false, message: REJECTED };

  // Fans may only write `body` (column grant + RLS + rate-limit trigger); author_id defaults to auth.uid().
  const supabase = await serverClient();
  const { error } = await supabase.from("wall_messages").insert({ body });
  if (error) {
    const blocked = wallInsertError(error);
    if (blocked) return { ok: false, message: blocked };
    console.error("postWallMessage", error);
    return { ok: false, message: "Có lỗi, thử lại sau." };
  }

  // Pending until an admin approves it, so the cached public wall does not change yet;
  // only the author's own "đang chờ duyệt" list (uncached, read per request) shows it.
  return { ok: true, message: "Đã gửi lời nhắn. Lời nhắn sẽ hiện trên tường sau khi được duyệt." };
}

/** Friendly message for the guards in limit_wall_messages() and RLS, or null for other errors. */
function wallInsertError(error: { code?: string; message: string }): string | null {
  if (error.code === "42501") return "Tài khoản này đã bị khóa gửi nội dung.";
  if (error.message.includes("rate_limited_new")) return "Tài khoản mới viết tối đa 1 lời nhắn trong ngày đầu, mai quay lại nhé.";
  if (error.message.includes("rate_limited_global")) return "Đang có quá nhiều lời nhắn cùng lúc, thử lại sau ít phút nhé.";
  if (error.message.includes("rate_limited")) return "Bạn đã viết 3 lời nhắn hôm nay, mai quay lại nhé.";
  if (error.message.includes("too_short")) return "Lời nhắn ít nhất 2 ký tự.";
  if (error.code === "23514") return `Lời nhắn từ ${WALL_MIN} đến ${WALL_MAX} ký tự.`;
  return null;
}
