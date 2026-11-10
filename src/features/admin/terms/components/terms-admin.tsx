import { button, input, primary, Section } from "@/features/admin/ui";
import { formatDate } from "@/shared/lib/format";
import { serverClient } from "@/server/supabase/server";
import { profileNames } from "../../users/server/names";
import { addBlockedTerm, deleteBlockedTerm } from "../actions";
import { CATEGORY_LABEL, isTermCategory, TERM_CATEGORIES } from "../lib/terms";

interface TermRow {
  term: string;
  category: string;
  created_by: string | null;
  created_at: string;
}

/** /admin/tu-khoa: terms added on top of the built-in lexicon (src/shared/lib/moderation/lexicon.ts). */
export async function TermsAdmin() {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("blocked_terms").select("term,category,created_by,created_at").order("created_at", { ascending: false });
  if (error) throw new Error(`blocked_terms: ${error.message}`);
  const rows = (data ?? []) as TermRow[];
  const names = await profileNames(
    supabase,
    rows.map((r) => r.created_by),
  );
  return (
    <div className="space-y-4">
      <Section title="Thêm từ khóa chặn">
        <p className="text-xs text-muted">
          Bài gửi chứa từ khóa sẽ bị từ chối ngay với thông báo chung (không nói từ nào). So khớp cả khi viết không dấu, viết cách (n.h.a c.a.i) hay thay chữ
          bằng số (c4 d0). Riêng loại “tục tĩu” có dấu chỉ khớp khi viết đúng dấu, để “đĩ” không chặn nhầm “đi”. Có hiệu lực sau tối đa vài phút.
        </p>
        <form action={addBlockedTerm} className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="term">
            Từ khóa
          </label>
          <input id="term" name="term" required minLength={2} maxLength={60} placeholder="ví dụ: kèo thơm" className={input} />
          <label className="sr-only" htmlFor="category">
            Loại
          </label>
          <select id="category" name="category" defaultValue="spam" className={input}>
            {TERM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <button className={primary}>Thêm</button>
        </form>
      </Section>
      <Section title={`Từ khóa đang chặn (${rows.length})`}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Chưa có từ khóa nào ngoài bộ lọc có sẵn.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {rows.map((r) => (
              <li key={r.term} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <strong>{r.term}</strong> · {isTermCategory(r.category) ? CATEGORY_LABEL[r.category] : r.category}
                  <span className="text-muted">
                    {" "}
                    · {r.created_by ? (names.get(r.created_by) ?? "?") : "hệ thống / tài khoản đã xóa"} · {formatDate(r.created_at)}
                  </span>
                </span>
                <form action={deleteBlockedTerm.bind(null, r.term)}>
                  <button className={button}>
                    Xóa<span className="sr-only"> {r.term}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
