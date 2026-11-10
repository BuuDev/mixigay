import { button, primary, Section } from "@/features/admin/ui";
import { ScreenFlags, UserModeration } from "@/features/admin/components/user-moderation";
import { formatDate } from "@/shared/lib/format";
import { screenText } from "@/shared/lib/moderation/screen";
import { serverClient } from "@/server/supabase/server";
import { PENDING_FIRST, RejectedBadge, REJECTED_COLUMNS, type RejectedFields } from "@/features/moderation/components/rejected-badge";
import { mapQuotes, QUOTE_SELECT, type QuoteRow } from "../lib/mapper";
import { formatClock, quoteMomentUrl } from "../lib/moment";
import { deleteQuote, setQuoteApproved } from "./actions";

/** Moderation queue for the quote archive: pending first, newest first. */
export async function QuoteAdmin() {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("quotes")
    .select(`${QUOTE_SELECT},${REJECTED_COLUMNS}`)
    .order("approved")
    .order("rejected_at", PENDING_FIRST)
    .order("created_at", { ascending: false })
    .limit(300);
  const raw = (data ?? []) as unknown as (QuoteRow & RejectedFields)[];
  const rejected = new Map(raw.filter((r) => r.rejected_at).map((r) => [r.id, r]));
  const quotes = mapQuotes(raw);
  return (
    <Section title="Kho quote – duyệt quote">
      <p className="text-xs text-muted">
        Mở mốc thời gian trên YouTube và chỉ duyệt khi câu chữ khớp đúng điều được nói ở đó: quote là lời của người thật. Không duyệt quote bịa, cắt ghép gây
        hiểu sai, xúc phạm hay quảng cáo. Mỗi giây của một video chỉ duyệt được một quote. Gặp người cố tình phá: dùng Cấm / Cấm ngầm, đừng xóa từng quote – xóa
        sẽ trả lại hạn mức gửi cho họ.
      </p>
      <ul className="divide-y divide-border text-sm">
        {quotes.map((q) => (
          <li key={q.id} className="flex flex-wrap items-center gap-3 py-2">
            <span className="min-w-0 flex-1 space-y-1">
              <span className="block">
                <RejectedBadge row={rejected.get(q.id) ?? {}} />
                {!q.approved && !rejected.has(q.id) && <span className="mr-1 rounded bg-accent/20 px-1.5 text-xs font-semibold">chờ duyệt</span>}
                <span className="text-muted">
                  {q.author}
                  {q.authorVerified && " ✓ Chính chủ"} · {formatDate(q.createdAt)} · {q.approved ? "đã duyệt" : rejected.has(q.id) ? "đã từ chối" : "chờ duyệt"}
                </span>
                <ScreenFlags flags={screenText([q.body]).flags} />
              </span>
              <span className="block break-words">“{q.body}”</span>
              <span className="block text-xs text-muted">
                <a href={quoteMomentUrl(q.videoId, q.atSeconds)} target="_blank" rel="noopener noreferrer" className="font-mono underline underline-offset-2">
                  {formatClock(q.atSeconds)}
                </a>{" "}
                · {q.videoTitle ?? q.videoId}
              </span>
              {q.authorId && <UserModeration userId={q.authorId} />}
            </span>
            <form action={setQuoteApproved.bind(null, q.id, !q.approved)}>
              <button className={q.approved ? button : primary}>{q.approved ? "Gỡ duyệt" : "Duyệt"}</button>
            </form>
            <form action={deleteQuote.bind(null, q.id)}>
              <button className={button} title="Xóa hẳn (trả lại hạn mức gửi cho tác giả – với spam hãy dùng Cấm)">
                Xóa hẳn
              </button>
            </form>
          </li>
        ))}
        {!quotes.length && <li className="py-2 text-muted">Chưa có quote nào.</li>}
      </ul>
    </Section>
  );
}
