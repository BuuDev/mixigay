import { requireAdmin } from "@/lib/auth";
import { getGames, SUGGESTION_SELECT } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { serverClient } from "@/lib/supabase/server";
import { deleteSuggestion, updateSuggestion } from "../actions";
import { button, GameSelect, input, primary, Section } from "../ui";

export default async function AdminSuggestions() {
  await requireAdmin();
  const supabase = await serverClient();
  const [{ data }, games] = await Promise.all([
    supabase.from("suggestions").select(SUGGESTION_SELECT).order("status").order("upvotes", { ascending: false }).limit(300),
    getGames(),
  ]);
  const rows = (data ?? []) as unknown as {
    id: string;
    name: string;
    status: string;
    upvotes: number;
    hidden: boolean;
    reason: string;
    linked_game_slug: string | null;
    created_at: string;
    profiles: { display_name: string } | null;
  }[];
  return (
    <Section title="Đề xuất">
      <ul className="divide-y divide-border text-sm">
        {rows.map((s) => (
          <li key={s.id} className={`space-y-1 py-2 ${s.hidden ? "opacity-50" : ""}`}>
            <div>
              <strong>{s.name}</strong> · {s.upvotes} vote · {s.profiles?.display_name} · {formatDate(s.created_at)}
            </div>
            <p className="text-muted">{s.reason}</p>
            <form action={updateSuggestion} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={s.id} />
              <select name="status" defaultValue={s.status} className={input}>
                <option value="pending">Đang chờ</option>
                <option value="played">Độ đã chơi</option>
                <option value="rejected">Từ chối</option>
              </select>
              <GameSelect games={games} value={s.linked_game_slug} empty="— liên kết game —" />
              <label className="flex items-center gap-1">
                <input type="checkbox" name="hidden" defaultChecked={s.hidden} /> ẩn (spam)
              </label>
              <button className={primary}>Lưu</button>
              <button formAction={deleteSuggestion.bind(null, s.id)} className={button}>
                Xóa
              </button>
            </form>
          </li>
        ))}
      </ul>
    </Section>
  );
}
