import { EmptyState } from "@/shared/ui/empty-state";
import type { Quote } from "../types";
import { QuoteCard } from "./quote-card";

export function QuoteEmpty() {
  return (
    <EmptyState mascot="win" title="Chưa có quote nào trong kho">
      Nhớ một câu nói đáng nhớ trên sóng? Chọn video, ghi mốc thời gian và chép đúng nguyên văn. Admin mở đúng mốc đó trên YouTube để kiểm tra rồi mới duyệt.
    </EmptyState>
  );
}

/** Approved quotes, newest first, in equal-height cards. */
export function QuoteList({ quotes }: { quotes: Quote[] }) {
  if (!quotes.length) return <QuoteEmpty />;
  const sorted = [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sorted.map((q) => (
        <li key={q.id}>
          <QuoteCard quote={q} />
        </li>
      ))}
    </ul>
  );
}

/** The author's own quotes that only they can see (pending review, or demo ones kept in the browser). */
export function MyQuotes({ title, note, quotes, badge }: { title: string; note: string; quotes: Quote[]; badge: string }) {
  if (!quotes.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted">{note}</p>
      <ul className="space-y-2">
        {quotes.map((q) => (
          <li key={q.id}>
            <QuoteCard quote={q} badge={badge} />
          </li>
        ))}
      </ul>
    </div>
  );
}
