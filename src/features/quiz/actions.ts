"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { screenText } from "@/shared/lib/moderation/screen";
import { quizLinkInsertError } from "./lib/errors";
import { QUIZ_DESCRIPTION_MAX, QUIZ_PLATFORM_LIST, QUIZ_TITLE_MAX, QUIZ_TITLE_MIN, QUIZ_URL_MAX, quizPlatform } from "./lib/quiz-url";

export type QuizLinkFormResult = { ok: true; message: string } | { ok: false; message: string } | null;

const REJECTED = "Nội dung không phù hợp với Góc Bộ Tộc. Viết lại lịch sự, không kèm quảng cáo nhé.";

/** Length as Postgres char_length counts it (code points). */
const chars = (s: string) => [...s].length;

const QuizLinkInput = z.object({
  title: z
    .string()
    .trim()
    .refine((s) => chars(s) >= QUIZ_TITLE_MIN, `Tên quiz ít nhất ${QUIZ_TITLE_MIN} ký tự.`)
    .refine((s) => chars(s) <= QUIZ_TITLE_MAX, `Tên quiz tối đa ${QUIZ_TITLE_MAX} ký tự.`),
  url: z
    .string()
    .trim()
    .min(1, "Dán link quiz của bạn.")
    .refine((s) => chars(s) <= QUIZ_URL_MAX, `Link tối đa ${QUIZ_URL_MAX} ký tự.`)
    .refine((s) => quizPlatform(s) !== null, `Chỉ nhận link quiz trên ${QUIZ_PLATFORM_LIST}, bắt đầu bằng https://.`),
  description: z
    .string()
    .trim()
    .refine((s) => chars(s) <= QUIZ_DESCRIPTION_MAX, `Mô tả tối đa ${QUIZ_DESCRIPTION_MAX} ký tự.`),
});

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

/** Signed-in fan shares a quiz link; it stays hidden until an admin approves it. */
export async function submitQuizLink(_prev: QuizLinkFormResult, formData: FormData): Promise<QuizLinkFormResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Vào Bộ Tộc (đăng nhập) để gửi link quiz." };

  const parsed = QuizLinkInput.safeParse({ title: text(formData, "title"), url: text(formData, "url"), description: text(formData, "description") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { title, url, description } = parsed.data;

  // Generic on purpose: never tell a spammer which word tripped the filter.
  if (screenText([title, description]).verdict === "block") return { ok: false, message: REJECTED };

  // Fans may only write (title, url, description) (column grant + RLS + rate-limit trigger); author_id defaults to auth.uid().
  const supabase = await serverClient();
  const { error } = await supabase.from("quiz_links").insert({ title, url, description: description || null });
  if (error) {
    const friendly = quizLinkInsertError(error);
    if (friendly) return { ok: false, message: friendly };
    console.error("submitQuizLink", error);
    return { ok: false, message: "Có lỗi, thử lại sau." };
  }

  // Pending until an admin approves it: the cached board does not change,
  // but the author's own "đang chờ duyệt" list (read per request) does.
  refresh();
  return { ok: true, message: "Đã gửi link quiz. Link sẽ hiện trên bảng sau khi admin mở thử và duyệt." };
}
