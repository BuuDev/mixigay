import { button, primary, Section } from "@/features/admin/ui";
import { ScreenFlags, UserModeration } from "@/features/admin/components/user-moderation";
import { LORE } from "@/features/tribe/lib/lore";
import { formatDate } from "@/shared/lib/format";
import { screenText } from "@/shared/lib/moderation/screen";
import { serverClient } from "@/server/supabase/server";
import { GLOSSARY_SELECT, type GlossaryRow } from "../lib/mapper";
import { checkSourceUrl } from "../lib/source";
import { withoutCuratedTerms } from "../lib/terms";
import { deleteGlossaryEntry, setGlossaryApproved } from "./actions";

const CURATED_TERMS = LORE.map((e) => e.term);

/** Moderation queue for fan-contributed glossary entries: pending first, newest first. */
export async function GlossaryAdmin() {
  const supabase = await serverClient();
  const { data } = await supabase.from("glossary_entries").select(GLOSSARY_SELECT).order("approved").order("created_at", { ascending: false }).limit(300);
  const rows = (data ?? []) as unknown as (GlossaryRow & { author_id: string })[];
  return (
    <Section title="Từ điển – duyệt từ fan góp">
      <p className="text-xs text-muted">
        Mục từ chỉ hiện trong Từ điển Bộ Tộc (trang Bộ Tộc) sau khi duyệt. Mở link nguồn và chỉ duyệt khi nguồn nói đúng như phần giải nghĩa; không duyệt biệt
        danh xúc phạm, quảng cáo, mạo danh kênh hay thông tin chưa kiểm chứng về người thật. Từ trùng với mục có sẵn sẽ không hiện (mục có sẵn được ưu tiên).
      </p>
      <ul className="divide-y divide-border text-sm">
        {rows.map((g) => {
          const source = checkSourceUrl(g.source_url);
          const clashes = withoutCuratedTerms([g], CURATED_TERMS).length === 0;
          return (
            <li key={g.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block">
                  {!g.approved && <span className="mr-1 rounded bg-accent/20 px-1.5 text-xs font-semibold">chờ duyệt</span>}
                  <span className="text-muted">
                    {g.profiles?.display_name ?? "Fan"}
                    {g.profiles?.verified && " ✓ Chính chủ"} · {formatDate(g.created_at)} · {g.approved ? "đã duyệt" : "chờ duyệt"}
                  </span>
                  <ScreenFlags flags={screenText([g.term, g.meaning]).flags} />
                  {clashes && <span className="ml-1 rounded bg-live/15 px-1.5 text-xs font-semibold text-live-text">⚠ trùng mục có sẵn</span>}
                  {!source.ok && <span className="ml-1 rounded bg-live/15 px-1.5 text-xs font-semibold text-live-text">⚠ nguồn ngoài danh sách</span>}
                </span>
                <span className="block font-semibold break-words">{g.term}</span>
                <span className="block break-words">{g.meaning}</span>
                <a
                  href={g.source_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="block text-xs break-all text-accent underline underline-offset-2"
                >
                  Mở nguồn để kiểm tra{source.ok ? ` (${source.label})` : ""}: {g.source_url}
                </a>
                <UserModeration userId={g.author_id} />
              </span>
              <form action={setGlossaryApproved.bind(null, g.id, !g.approved)}>
                <button className={g.approved ? button : primary}>{g.approved ? "Gỡ duyệt" : "Duyệt"}</button>
              </form>
              <form action={deleteGlossaryEntry.bind(null, g.id)}>
                <button className={button} title="Xóa hẳn (trả lại hạn mức gửi cho tác giả – với spam hãy dùng Cấm)">
                  Xóa hẳn
                </button>
              </form>
            </li>
          );
        })}
        {!rows.length && <li className="py-2 text-muted">Chưa có mục từ nào.</li>}
      </ul>
    </Section>
  );
}
