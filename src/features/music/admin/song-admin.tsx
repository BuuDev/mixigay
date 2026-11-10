import { button, primary, Section } from "@/features/admin/ui";
import { ScreenFlags, UserModeration } from "@/features/admin/components/user-moderation";
import { formatDate } from "@/shared/lib/format";
import { screenText } from "@/shared/lib/moderation/screen";
import { serverClient } from "@/server/supabase/server";
import { PLATFORM_LABEL, songPlatform } from "../lib/song-url";
import { deleteSong, refetchSongCover, setSongApproved } from "./actions";

/** Moderation queue for fan songs: pending first. Open each link before approving. */
export async function SongAdmin() {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("fan_songs")
    .select("id,author_id,title,artist,url,note,approved,created_at,thumbnail_url")
    .order("approved")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data ?? []) as {
    id: string;
    author_id: string;
    title: string;
    artist: string;
    url: string;
    note: string | null;
    approved: boolean;
    created_at: string;
    thumbnail_url: string | null;
  }[];
  return (
    <Section title="Nhạc nịnh – duyệt bài">
      <p className="text-xs text-muted">
        Mở link nghe thử trước khi duyệt. Không duyệt bài có lời lẽ xúc phạm, nội dung bản quyền đem đi bán, hoặc mạo danh kênh.
      </p>
      <ul className="divide-y divide-border text-sm">
        {rows.map((s) => {
          const platform = songPlatform(s.url);
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="font-semibold hover:underline">
                  {s.title}
                </a>{" "}
                <span className="text-muted">
                  — {s.artist} · {platform ? PLATFORM_LABEL[platform] : "link lạ"} · {formatDate(s.created_at)} · {s.approved ? "đã duyệt" : "chờ duyệt"} ·{" "}
                  {s.thumbnail_url ? "có ảnh bìa" : "chưa có ảnh bìa"}
                </span>
                <ScreenFlags flags={screenText([s.title, s.artist, s.note]).flags} />
                {s.note && <span className="block text-xs text-muted">{s.note}</span>}
                <UserModeration userId={s.author_id} />
              </span>
              <form action={setSongApproved.bind(null, s.id, !s.approved)}>
                <button className={s.approved ? button : primary}>{s.approved ? "Gỡ duyệt" : "Duyệt"}</button>
              </form>
              <form action={refetchSongCover.bind(null, s.id)}>
                <button className={button}>Lấy lại ảnh bìa</button>
              </form>
              <form action={deleteSong.bind(null, s.id)}>
                <button className={button} title="Xóa hẳn (trả lại hạn mức gửi cho tác giả – với spam hãy dùng Cấm)">
                  Xóa hẳn
                </button>
              </form>
            </li>
          );
        })}
        {!rows.length && <li className="py-2 text-muted">Chưa có bài nào.</li>}
      </ul>
    </Section>
  );
}
