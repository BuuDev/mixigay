"use server";

import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { screenText } from "@/shared/lib/moderation/screen";

export type QuizSubmitResult = { ok: boolean; message: string } | null;

const QuizInput = z.object({
  question: z.string().trim().min(10, "Câu hỏi ít nhất 10 ký tự").max(240),
  optionA: z.string().trim().min(1, "Nhập đủ 4 đáp án A, B, C, D").max(120),
  optionB: z.string().trim().min(1, "Nhập đủ 4 đáp án A, B, C, D").max(120),
  optionC: z.string().trim().min(1, "Nhập đủ 4 đáp án A, B, C, D").max(120),
  optionD: z.string().trim().min(1, "Nhập đủ 4 đáp án A, B, C, D").max(120),
  correctIndex: z.coerce.number().int().min(0).max(3),
  explanation: z.string().trim().max(300).optional(),
  authorName: z.string().trim().min(1).max(60).optional(),
});

/** Signed-in fan submits a quiz question; it remains unapproved until an admin approves it. */
export async function submitQuizQuestion(_prev: QuizSubmitResult, formData: FormData): Promise<QuizSubmitResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Vào Bộ Tộc (đăng nhập) để đóng góp câu hỏi đố vui." };

  const parsed = QuizInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu câu hỏi không hợp lệ" };

  const { question, optionA, optionB, optionC, optionD, correctIndex, explanation, authorName } = parsed.data;
  if (screenText([question, optionA, optionB, optionC, optionD, explanation, authorName]).verdict === "block") {
    return { ok: false, message: "Nội dung không phù hợp với Góc Bộ Tộc. Viết lại lịch sự, không kèm quảng cáo nhé." };
  }

  const supabase = await serverClient();
  const { error } = await supabase.from("quiz_questions").insert({
    question,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
    correct_index: correctIndex,
    explanation: explanation || null,
    author_name: authorName || viewer.name || "Bộ Tộc",
  });

  if (error) {
    if (error.message.includes("rate_limited_new")) return { ok: false, message: "Tài khoản mới gửi tối đa 1 câu hỏi trong ngày đầu, mai quay lại nhé." };
    if (error.message.includes("rate_limited_global")) return { ok: false, message: "Đang có nhiều câu hỏi gửi cùng lúc, thử lại sau ít phút nhé." };
    if (error.message.includes("rate_limited")) return { ok: false, message: "Mỗi ngày gửi tối đa 3 câu hỏi, mai quay lại nhé." };
    if (error.message.includes("too_short")) return { ok: false, message: "Câu hỏi hoặc đáp án quá ngắn." };
    if (error.code === "42501") return { ok: false, message: "Tài khoản này đã bị khóa gửi nội dung." };
    console.error("submitQuizQuestion", error);
    return { ok: false, message: "Có lỗi khi gửi câu hỏi, thử lại sau nhé." };
  }

  return { ok: true, message: "Đã gửi câu hỏi đố vui! Câu hỏi sẽ xuất hiện trong bộ đề sau khi được duyệt." };
}

