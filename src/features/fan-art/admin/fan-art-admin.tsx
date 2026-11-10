import { ScreenFlags, UserModeration } from "@/features/admin/components/user-moderation";
import { button, primary, Section } from "@/features/admin/ui";
import { serverClient } from "@/server/supabase/server";
import { PENDING_FIRST, RejectedBadge, REJECTED_COLUMNS, type RejectedFields } from "@/features/moderation/components/rejected-badge";
import { formatDate } from "@/shared/lib/format";
import { screenText } from "@/shared/lib/moderation/screen";
import { driveImageUrl } from "../lib/drive";
import { deleteFanArt, setFanArtApproved } from "./actions";

/** Moderation queue for Google Drive fan art: renders the Drive thumbnail inline so Admin can visually review before approving. */
export async function FanArtAdmin() {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("fan_art")
    .select(`id,author_id,title,artist,drive_url,drive_file_id,note,approved,created_at,${REJECTED_COLUMNS}`)
    .order("approved")
    .order("rejected_at", PENDING_FIRST)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as (RejectedFields & {
    id: string;
    author_id: string;
    title: string;
    artist: string;
    drive_url: string;
    drive_file_id: string;
    note: string | null;
    approved: boolean;
    created_at: string;
  })[];

  return (
    <Section title="Tranh Fan Art (Google Drive) – duyệt bài">
      <p className="text-xs text-muted">
        Ảnh được tải trực tiếp từ Google Drive cá nhân của người gửi (không tốn bộ nhớ server). Kiểm tra kỹ hình ảnh hiển thị trước khi bấm Duyệt.
      </p>
      <ul className="divide-y divide-border text-sm">
        {rows.map((a) => (
          <li key={a.id} className="flex flex-wrap items-start gap-4 py-3">
            <a
              href={a.drive_url}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="block h-24 w-32 shrink-0 overflow-hidden rounded border border-border bg-background"
              title="Mở link Google Drive gốc"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={driveImageUrl(a.drive_file_id, 400)} alt={a.title} loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
            </a>
            <span className="min-w-0 flex-1">
              <RejectedBadge row={a} />
              <a href={a.drive_url} target="_blank" rel="noopener noreferrer nofollow ugc" className="font-semibold hover:underline">
                {a.title}
              </a>{" "}
              <span className="text-muted">
                — {a.artist} · {formatDate(a.created_at)} · {a.approved ? "đã duyệt" : a.rejected_at ? "đã từ chối" : "chờ duyệt"}
              </span>
              <ScreenFlags flags={screenText([a.title, a.artist, a.note]).flags} />
              {a.note && <span className="block text-xs text-muted">{a.note}</span>}
              <UserModeration userId={a.author_id} />
            </span>
            <form action={setFanArtApproved.bind(null, a.id, !a.approved)}>
              <button className={a.approved ? button : primary}>{a.approved ? "Gỡ duyệt" : "Duyệt"}</button>
            </form>
            <form action={deleteFanArt.bind(null, a.id)}>
              <button className={button} title="Xóa hẳn">
                Xóa hẳn
              </button>
            </form>
          </li>
        ))}
        {!rows.length && <li className="py-2 text-muted">Chưa có bức tranh nào.</li>}
      </ul>
    </Section>
  );
}
