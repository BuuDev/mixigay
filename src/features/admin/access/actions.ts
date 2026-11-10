"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";
import { SITE_URL } from "@/shared/lib/links";

export type InviteResult = { ok: true; link: string; expiresHours: number } | { ok: false; message: string } | null;

const Input = z.object({ role: z.enum(["admin", "official"]), handle: z.string().trim().min(3).max(40), display: z.string().trim().min(1).max(50) });

/**
 * Owner only (checked in public.issue_invite). Returns the one-time link once: only its
 * hash is stored, so a lost link is simply revoked and re-issued.
 */
export async function createInvite(_prev: InviteResult, fd: FormData): Promise<InviteResult> {
  const parsed = Input.safeParse({ role: str(fd, "role"), handle: str(fd, "handle"), display: str(fd, "display") });
  if (!parsed.success) return { ok: false, message: "Điền đủ vai trò, tên đăng nhập (≥ 3 ký tự) và tên hiển thị." };
  const supabase = await adminDb();
  const { data, error } = await supabase.rpc("issue_invite", { p_role: parsed.data.role, p_handle: parsed.data.handle, p_display: parsed.data.display });
  if (error) {
    if (error.message.includes("handle_taken")) return { ok: false, message: "Tên đăng nhập này đã có người dùng hoặc đang chờ một lời mời khác." };
    if (error.message.includes("forbidden")) return { ok: false, message: "Chỉ chủ trang mới tạo được lời mời." };
    return { ok: false, message: "Chưa tạo được lời mời, thử lại sau." };
  }
  const h = await headers();
  const origin = SITE_URL || `https://${h.get("host")}`;
  return { ok: true, link: `${origin.replace(/\/$/, "")}/moi/${String(data)}`, expiresHours: 48 };
}

export async function revokeInvite(id: string) {
  const supabase = await adminDb();
  fail("revokeInvite", (await supabase.rpc("revoke_invite", { p_id: z.uuid().parse(id) })).error);
}

export async function removeAdmin(userId: string) {
  const supabase = await adminDb();
  fail("removeAdmin", (await supabase.rpc("remove_admin", { p_user: z.uuid().parse(userId) })).error);
  updateTag(TAGS.suggestions);
}
