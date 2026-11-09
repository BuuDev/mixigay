"use client";

import { useState } from "react";
import { AnimatePresence, m, rise } from "@/shared/motion";
import { Card } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSuggestionVotes } from "../hooks/use-suggestion-votes";
import type { Suggestion, SuggestionStatus } from "../types";
import { DemoForm } from "./demo-form";
import { STATUS } from "./labels";
import { SuggestionForm } from "./suggestion-form";
import { SuggestionItem } from "./suggestion-item";

interface Props {
  initial: Suggestion[];
  votedIds: string[];
  /** The viewer's own suggestions waiting for review (only they see these). */
  pending?: Suggestion[];
  /** "live" talks to Supabase; "demo" (no backend configured) keeps everything in the browser. */
  mode: "live" | "demo";
  signedIn: boolean;
}

const FILTERS = ["all", "pending", "played", "rejected"] as const;

export function SuggestionBoard({ initial, votedIds, pending = [], mode, signedIn }: Props) {
  const { items, voted, vote, notice, addDemo, demoItems } = useSuggestionVotes({ initial, votedIds, mode, signedIn });
  const [filter, setFilter] = useState<SuggestionStatus | "all">("all");
  const shown = items.filter((s) => filter === "all" || s.status === filter).sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="ds-de-xuat">
        <h2 id="ds-de-xuat" className="sr-only">
          Danh sách đề xuất
        </h2>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "Tất cả" : STATUS[f].label}
            </Chip>
          ))}
        </div>
        {notice && (
          <p role="status" className="mt-3 rounded-md bg-accent/10 px-3 py-2 text-sm">
            {notice}
          </p>
        )}
        {shown.length ? (
          <ul className="mt-4 space-y-3">
            <AnimatePresence initial={false}>
              {shown.map((s) => (
                <m.li key={s.id} variants={rise} initial="hidden" animate="visible" exit="exit">
                  <SuggestionItem suggestion={s} voted={voted.has(s.id)} onVote={() => vote(s.id)} />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState art="empty-suggestions" title="Chưa có đề xuất nào ở mục này">
              Hãy là người đầu tiên đề xuất một game cho anh Độ.
            </EmptyState>
          </div>
        )}
      </section>

      <aside>
        {mode === "demo" ? (
          <DemoForm items={demoItems} onAdd={addDemo} />
        ) : signedIn ? (
          <div className="space-y-4 lg:sticky lg:top-20">
            <SuggestionForm />
            {pending.length > 0 && (
              <Card className="p-4 text-sm">
                <h2 className="font-semibold">Đề xuất của bạn đang chờ duyệt</h2>
                <p className="mt-1 text-xs text-muted">Chỉ bạn thấy mục này. Đề xuất hiện công khai sau khi admin duyệt.</p>
                <ul className="mt-2 space-y-1">
                  {pending.map((s) => (
                    <li key={s.id} className="truncate">
                      ⏳ {s.name}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-4 text-sm lg:sticky lg:top-20">
            <h2 className="font-semibold">Đề xuất game cho anh Độ</h2>
            <p className="mt-2 text-muted">Bấm “Vào Bộ Tộc” (góc trên bên phải) để gửi đề xuất và upvote. Chỉ cần tên Bộ Tộc + mã khóa, không cần email.</p>
          </Card>
        )}
      </aside>
    </div>
  );
}
