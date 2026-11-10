"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { getBlockedTerms } from "@/features/admin/terms/server";
import { screenText } from "@/shared/lib/moderation/screen";
import { MEANING_MAX, MEANING_MIN, TERM_MAX, TERM_MIN, textLength } from "./lib/limits";
import { checkSourceUrl } from "./lib/source";

export type GlossaryFormResult = { ok: true; message: string } | { ok: false; message: string } | null;

const REJECTED = "Nội dung không phù hợp với Góc Bộ Tộc. Viết lại lịch sự, không kèm quảng cáo nhé.";

const GlossaryInput = z.object({
  term: z
    .string()
    .trim()
    .refine((s) => textLength(s) >= TERM_MIN && textLength(s) <= TERM_MAX, `Từ / biệt danh từ ${TERM_MIN} đến ${TERM_MAX} ký tự.`),
  meaning: z
    .string()
    .trim()
    .refine((s) => textLength(s) >= MEANING_MIN && textLength(s) <= MEANING_MAX, `Phần giải nghĩa từ ${MEANING_MIN} đến ${MEANING_MAX} ký tự.`),
  sourceUrl: z.string().trim(),
});

export async function submitGlossaryEntry(_prev: GlossaryFormResult, formData: FormData): Promise<GlossaryFormResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Vào Bộ Tộc (đăng nhập) để góp từ cho từ điển." };

  const parsed = GlossaryInput.safeParse({
    term: formData.get("term") ?? "",
    meaning: formData.get("meaning") ?? "",
    sourceUrl: formData.get("sourceUrl") ?? "",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { term, meaning } = parsed.data;
  const source = checkSourceUrl(parsed.data.sourceUrl);
  if (!source.ok) return { ok: false, message: source.message };
  // Generic on purpose: never tell a spammer which word tripped the filter.
  if (screenText([term, meaning], await getBlockedTerms()).verdict === "block") return { ok: false, message: REJECTED };

  // Fans may only write term/meaning/source_url (column grant + RLS + rate-limit trigger); author_id defaults to auth.uid().
  const supabase = await serverClient();
  const { error } = await supabase.from("glossary_entries").insert({ term, meaning, source_url: source.url });
  if (error) {
    const blocked = glossaryInsertError(error);
    if (blocked) return { ok: false, message: blocked };
    console.error("submitGlossaryEntry", error);
    return { ok: false, message: "Có lỗi, thử lại sau." };
  }

  // Pending until an admin approves it: the cached public deck does not change yet,
  // but the author's own "đang chờ duyệt" list (uncached, read per request) does.
  refresh();
  return { ok: true, message: "Đã gửi mục từ. Mục từ sẽ hiện trong Từ điển Bộ Tộc sau khi được duyệt." };
}

/** Friendly message for the guards in limit_glossary() and RLS, or null for other errors. */
function glossaryInsertError(error: { code?: string; message: string }): string | null {
  if (error.code === "42501") return "Tài khoản này đã bị khóa gửi nội dung.";
  if (error.message.includes("rate_limited_new")) return "Tài khoản mới góp tối đa 1 mục từ trong ngày đầu, mai quay lại nhé.";
  if (error.message.includes("rate_limited")) return "Bạn đã góp 3 mục từ hôm nay, mai quay lại nhé.";
  if (error.code === "23514") return `Kiểm tra lại: từ ${TERM_MIN}–${TERM_MAX} ký tự, giải nghĩa ${MEANING_MIN}–${MEANING_MAX} ký tự, link nguồn https://.`;
  return null;
}
