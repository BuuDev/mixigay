import { button, primary, Section } from "@/features/admin/ui";
import { ScreenFlags, UserModeration } from "@/features/admin/components/user-moderation";
import { formatDate } from "@/shared/lib/format";
import { screenText } from "@/shared/lib/moderation/screen";
import { serverClient } from "@/server/supabase/server";
import { deleteWallMessage, setWallApproved } from "./actions";

/** Moderation queue for the fan message wall: pending first, newest first. */
export async function WallAdmin() {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("wall_messages")
    .select("id,author_id,body,approved,created_at,profiles!author_id(display_name,verified)")
    .order("approved")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data ?? []) as unknown as {
    id: string;
    author_id: string;
    body: string;
    approved: boolean;
    created_at: string;
    profiles: { display_name: string | null; verified: boolean | null } | null;
  }[];
  return (
    <Section title="Bức tường Bộ Tộc – duyệt lời nhắn">
      <p className="text-xs text-muted">
        Lời nhắn chỉ hiện công khai (cả trên trang Gửi anh Độ) sau khi duyệt. Không duyệt lời lẽ xúc phạm, quảng cáo, mạo danh kênh hay thông tin chưa kiểm
        chứng về người thật. Gặp người cố tình phá: dùng Cấm / Cấm ngầm, đừng xóa từng tin – xóa sẽ trả lại hạn mức gửi cho họ.
      </p>
      <ul className="divide-y divide-border text-sm">
        {rows.map((w) => (
          <li key={w.id} className="flex flex-wrap items-center gap-3 py-2">
            <span className="min-w-0 flex-1 space-y-1">
              <span className="block">
                {!w.approved && <span className="mr-1 rounded bg-accent/20 px-1.5 text-xs font-semibold">chờ duyệt</span>}
                <span className="text-muted">
                  {w.profiles?.display_name ?? "Fan"}
                  {w.profiles?.verified && " ✓ Chính chủ"} · {formatDate(w.created_at)} · {w.approved ? "đã duyệt" : "chờ duyệt"}
                </span>
                <ScreenFlags flags={screenText([w.body]).flags} />
              </span>
              <span className="block break-words">{w.body}</span>
              <UserModeration userId={w.author_id} />
            </span>
            <form action={setWallApproved.bind(null, w.id, !w.approved)}>
              <button className={w.approved ? button : primary}>{w.approved ? "Gỡ duyệt" : "Duyệt"}</button>
            </form>
            <form action={deleteWallMessage.bind(null, w.id)}>
              <button className={button} title="Xóa hẳn (trả lại hạn mức gửi cho tác giả – với spam hãy dùng Cấm)">
                Xóa hẳn
              </button>
            </form>
          </li>
        ))}
        {!rows.length && <li className="py-2 text-muted">Chưa có lời nhắn nào.</li>}
      </ul>
    </Section>
  );
}
