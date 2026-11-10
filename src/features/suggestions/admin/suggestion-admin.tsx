import { getGames } from "@/features/videos/server/queries";
import { ScreenFlags, UserModeration } from "@/features/admin/components/user-moderation";
import { formatDate } from "@/shared/lib/format";
import { screenText } from "@/shared/lib/moderation/screen";
import { serverClient } from "@/server/supabase/server";
import { deleteSuggestion, updateSuggestion } from "./actions";
import { button, GameSelect, input, primary, Section } from "@/features/admin/ui";

export async function SuggestionAdmin() {
  const supabase = await serverClient();
  const [{ data }, games] = await Promise.all([
    supabase
      .from("suggestions")
      .select("id,author_id,name,url,status,upvotes,hidden,approved,reason,linked_game_slug,created_at,profiles!author_id(display_name)")
      .order("approved")
      .order("hidden")
      .order("created_at", { ascending: false })
      .limit(300),
    getGames(),
  ]);
  const rows = (data ?? []) as unknown as {
    id: string;
    author_id: string;
    name: string;
    url: string | null;
    approved: boolean;
    status: string;
    upvotes: number;
    hidden: boolean;
    reason: string;
    linked_game_slug: string | null;
    created_at: string;
    profiles: { display_name: string } | null;
  }[];
  return (
    <Section title="Đề xuất – duyệt trước khi hiện">
      <p className="text-xs text-muted">
        Đề xuất mới chỉ hiện công khai khi tick “duyệt”. Gặp người cố tình phá: dùng Cấm / Cấm ngầm (ẩn hết bài của họ), đừng xóa từng bài – xóa sẽ trả lại hạn
        mức gửi cho họ.
      </p>
      <ul className="divide-y divide-border text-sm">
        {rows.map((s) => (
          <li key={s.id} className={`space-y-1 py-2 ${s.hidden ? "opacity-50" : ""}`}>
            <div>
              {!s.approved && !s.hidden && <span className="mr-1 rounded bg-accent/20 px-1.5 text-xs font-semibold">chờ duyệt</span>}
              <strong>{s.name}</strong> · {s.upvotes} vote · {s.profiles?.display_name} · {formatDate(s.created_at)}
              <ScreenFlags flags={screenText([s.name, s.reason, s.url]).flags} />
            </div>
            <p className="text-muted">{s.reason}</p>
            {s.url && <p className="text-xs break-all text-muted">{s.url}</p>}
            <UserModeration userId={s.author_id} />
            <form action={updateSuggestion} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={s.id} />
              <select name="status" defaultValue={s.status} className={input}>
                <option value="pending">Đang chờ</option>
                <option value="played">Anh Độ đã chơi</option>
                <option value="rejected">Từ chối</option>
              </select>
              <GameSelect games={games} value={s.linked_game_slug} empty="— liên kết game —" />
              <label className="flex items-center gap-1">
                <input type="checkbox" name="approved" defaultChecked={s.approved} /> duyệt
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" name="hidden" defaultChecked={s.hidden} /> ẩn (spam)
              </label>
              <button className={primary}>Lưu</button>
              <button
                formAction={deleteSuggestion.bind(null, s.id)}
                className={button}
                title="Xóa hẳn (trả lại hạn mức gửi cho tác giả – với spam hãy dùng ẩn hoặc Cấm)"
              >
                Xóa hẳn
              </button>
            </form>
          </li>
        ))}
      </ul>
    </Section>
  );
}
