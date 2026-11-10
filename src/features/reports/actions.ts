"use server";

import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { REASONS, REPORT_KINDS } from "./lib/reasons";

export type ReportResult = { ok: boolean; message: string };

const Input = z.object({ kind: z.enum(REPORT_KINDS), id: z.uuid(), reason: z.enum(REASONS) });

/** A fan flags something for the admins. The target must be published (checked in the DB trigger). */
export async function reportContent(kind: string, id: string, reason: string): Promise<ReportResult> {
  const parsed = Input.safeParse({ kind, id, reason });
  if (!parsed.success) return { ok: false, message: "Báo cáo không hợp lệ." };
  if (!(await getViewer())) return { ok: false, message: "Vào Bộ Tộc (đăng nhập) để báo cáo." };
  const supabase = await serverClient();
  // No .select(): reporters cannot read reports back (RLS), so RETURNING would fail.
  const { error } = await supabase.from("reports").insert({ target_kind: parsed.data.kind, target_id: parsed.data.id, reason: parsed.data.reason });
  if (!error) return { ok: true, message: "Đã gửi báo cáo. Cảm ơn bạn giữ Góc Bộ Tộc sạch sẽ!" };
  if (error.code === "23505") return { ok: true, message: "Bạn đã báo cáo mục này rồi, admin sẽ xem sớm." };
  if (error.message.includes("rate_limited")) return { ok: false, message: "Bạn đã gửi nhiều báo cáo hôm nay, mai thử lại nhé." };
  if (error.message.includes("not_found")) return { ok: false, message: "Mục này không còn hiển thị nữa." };
  if (error.code === "42501") return { ok: false, message: "Tài khoản này không gửi báo cáo được." };
  console.error("reportContent", error);
  return { ok: false, message: "Có lỗi, thử lại sau." };
}
