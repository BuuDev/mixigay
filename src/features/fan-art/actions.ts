"use server";

import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { screenText } from "@/shared/lib/moderation/screen";
import { canonicalDriveUrl, extractDriveFileId } from "./lib/drive";

export type FanArtResult = { ok: boolean; message: string } | null;

const FanArtInput = z.object({
  title: z.string().trim().min(2, "Tên bức vẽ ít nhất 2 ký tự").max(120),
  artist: z.string().trim().min(1, "Ghi tên tác giả / bút danh").max(80),
  driveUrl: z.string().trim().max(500),
  note: z.string().trim().max(300).optional(),
});

/** A fan submits a Google Drive share link; it stays pending until an admin reviews and approves it. */
export async function submitFanArt(_prev: FanArtResult, formData: FormData): Promise<FanArtResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Đăng nhập Google để gửi tranh vẽ." };

  const parsed = FanArtInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const { title, artist, driveUrl, note } = parsed.data;
  const fileId = extractDriveFileId(driveUrl);
  if (!fileId) {
    return {
      ok: false,
      message: "Chỉ nhận link chia sẻ file ảnh từ Google Drive cá nhân (dạng https://drive.google.com/file/d/.../view).",
    };
  }

  if (screenText([title, artist, note]).verdict === "block") {
    return { ok: false, message: "Nội dung không phù hợp với Góc Bộ Tộc. Viết lại lịch sự, không kèm quảng cáo nhé." };
  }

  const supabase = await serverClient();
  const { error } = await supabase.from("fan_art").insert({
    title,
    artist,
    drive_url: canonicalDriveUrl(fileId),
    drive_file_id: fileId,
    note: note || null,
  });

  if (error) {
    if (error.message.includes("rate_limited_new")) return { ok: false, message: "Tài khoản mới gửi tối đa 1 tranh trong ngày đầu, mai quay lại nhé." };
    if (error.message.includes("rate_limited_global")) return { ok: false, message: "Đang có nhiều tranh gửi cùng lúc, thử lại sau ít phút nhé." };
    if (error.message.includes("rate_limited")) return { ok: false, message: "Mỗi ngày gửi tối đa 3 bức tranh, mai quay lại nhé." };
    if (error.message.includes("too_short")) return { ok: false, message: "Tên bức tranh hoặc tên tác giả quá ngắn." };
    if (error.code === "42501") return { ok: false, message: "Tài khoản này đã bị khóa gửi nội dung." };
    console.error("submitFanArt", error);
    return { ok: false, message: "Có lỗi khi gửi tranh, thử lại sau nhé." };
  }

  return { ok: true, message: `Đã gửi tranh “${title}”. Admin sẽ xem trước ảnh từ link Drive và duyệt lên phòng tranh!` };
}

