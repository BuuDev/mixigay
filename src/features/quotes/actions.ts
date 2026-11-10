"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { screenText } from "@/shared/lib/moderation/screen";
import { quoteInsertError } from "./lib/errors";
import { QUOTE_MAX, QUOTE_MIN, quoteLength } from "./lib/limits";
import { resolveMoment } from "./lib/moment";
import { quoteMaxSecondsLookup } from "./server/queries";

export type QuoteFormResult = { ok: true; message: string } | { ok: false; message: string } | null;

const REJECTED = "Nội dung không phù hợp với Góc Bộ Tộc. Viết lại lịch sự, không kèm quảng cáo nhé.";

const field = z.string().max(400).optional().default("");

const QuoteInput = z.object({
  videoId: field,
  link: field,
  time: field,
  body: z
    .string()
    .trim()
    .refine((s) => quoteLength(s) >= QUOTE_MIN, `Quote ít nhất ${QUOTE_MIN} ký tự.`)
    .refine((s) => quoteLength(s) <= QUOTE_MAX, `Quote tối đa ${QUOTE_MAX} ký tự.`),
});

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

export async function submitQuote(_prev: QuoteFormResult, formData: FormData): Promise<QuoteFormResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Vào Bộ Tộc (đăng nhập) để gửi quote." };

  const parsed = QuoteInput.safeParse({
    videoId: text(formData, "videoId"),
    link: text(formData, "link"),
    time: text(formData, "time"),
    body: text(formData, "body"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { body, ...where } = parsed.data;

  const moment = resolveMoment(where, await quoteMaxSecondsLookup());
  if (!moment.ok) return moment;
  // Generic on purpose: never tell a spammer which word tripped the filter.
  if (screenText([body]).verdict === "block") return { ok: false, message: REJECTED };

  // Fans may only write (video_id, at_seconds, body) (column grant + RLS + rate-limit trigger); author_id defaults to auth.uid().
  const supabase = await serverClient();
  const { error } = await supabase.from("quotes").insert({ video_id: moment.videoId, at_seconds: moment.atSeconds, body });
  if (error) {
    const friendly = quoteInsertError(error);
    if (friendly) return { ok: false, message: friendly };
    console.error("submitQuote", error);
    return { ok: false, message: "Có lỗi, thử lại sau." };
  }

  // Pending until an admin approves it: the cached public list does not change,
  // but the author's own "đang chờ duyệt" list (read per request) does.
  refresh();
  return { ok: true, message: "Đã gửi quote. Quote sẽ hiện trong kho sau khi admin mở đúng mốc video và duyệt." };
}
