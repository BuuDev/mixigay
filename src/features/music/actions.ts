"use server";

import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { screenText } from "@/shared/lib/moderation/screen";
import { songPlatform } from "./lib/song-url";

export type SongResult = { ok: boolean; message: string } | null;

const SongInput = z.object({
  title: z.string().trim().min(2, "Tên bài ít nhất 2 ký tự").max(120),
  artist: z.string().trim().min(1, "Ghi tên người làm nhạc").max(80),
  url: z.string().trim().max(500),
  note: z.string().trim().max(300).optional(),
});

/** A fan submits a song link; it stays hidden until an admin approves it. */
export async function submitSong(_prev: SongResult, formData: FormData): Promise<SongResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Đăng nhập Google để gửi bài." };
  const parsed = SongInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { title, artist, url, note } = parsed.data;
  if (!songPlatform(url)) return { ok: false, message: "Chỉ nhận link https từ YouTube, SoundCloud, TikTok, Spotify, Zing MP3, NhacCuaTui." };
  // Generic on purpose: never tell a spammer which word tripped the filter.
  if (screenText([title, artist, note]).verdict === "block") {
    return { ok: false, message: "Nội dung không phù hợp với Góc Bộ Tộc. Viết lại lịch sự, không kèm quảng cáo nhé." };
  }

  const supabase = await serverClient();
  const { error } = await supabase.from("fan_songs").insert({ title, artist, url, note: note || null });
  if (error) {
    if (error.message.includes("rate_limited_new")) return { ok: false, message: "Tài khoản mới gửi tối đa 1 bài trong ngày đầu, mai quay lại nhé." };
    if (error.message.includes("rate_limited_global")) return { ok: false, message: "Đang có nhiều bài gửi cùng lúc, thử lại sau ít phút nhé." };
    if (error.message.includes("rate_limited")) return { ok: false, message: "Mỗi ngày gửi tối đa 3 bài, mai quay lại nhé." };
    if (error.message.includes("too_short")) return { ok: false, message: "Tên bài hoặc người làm nhạc quá ngắn." };
    if (error.code === "42501") return { ok: false, message: "Tài khoản này đã bị khóa gửi nội dung." };
    console.error("submitSong", error);
    return { ok: false, message: "Có lỗi, thử lại sau." };
  }
  return { ok: true, message: `Đã gửi “${title}”. Bài sẽ hiện sau khi được duyệt.` };
}
