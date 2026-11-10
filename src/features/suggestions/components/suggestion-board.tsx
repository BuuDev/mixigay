"use client";

import { useMemo, useState } from "react";
import type { GameCoverRecord } from "@/features/videos/lib/game-cover";
import { AnimatePresence, m, rise, useReducedMotion } from "@/shared/motion";
import { Card } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSuggestionVotes } from "../hooks/use-suggestion-votes";
import { isFresh, risingIds, sortSuggestions } from "../lib/ranking";
import type { Suggestion, SuggestionStatus } from "../types";
import { DemoForm } from "./demo-form";
import { STATUS } from "./labels";
import { SuggestionForm } from "./suggestion-form";
import { SuggestionItem } from "./suggestion-item";
import { SortTabs, useSortParam } from "./sort-tabs";

interface Props {
  initial: Suggestion[];
  votedIds: string[];
  /** The viewer's own suggestions waiting for review (only they see these). */
  pending?: Suggestion[];
  /** "live" talks to Supabase; "demo" (no backend configured) keeps everything in the browser. */
  mode: "live" | "demo";
  signedIn: boolean;
  /** Stream thumbnails by game slug, for suggestions linked to a game anh Độ played. */
  covers?: GameCoverRecord;
  /** Clock for hot scores (ms), from getTonightLineup().rankedAt so server and client rank alike. */
  rankedAt: number;
}

const FILTERS = ["all", "pending", "played", "rejected"] as const;

export function SuggestionBoard({ initial, votedIds, pending = [], mode, signedIn, covers, rankedAt }: Props) {
  const { items, voted, vote, notice, addDemo, demoItems } = useSuggestionVotes({ initial, votedIds, mode, signedIn });
  const [filter, setFilter] = useState<SuggestionStatus | "all">("all");
  const [sort, setSort] = useSortParam();
  const reduceMotion = useReducedMotion();
  const shown = useMemo(() => sortSuggestions(items, sort, rankedAt).filter((s) => filter === "all" || s.status === filter), [items, sort, filter, rankedAt]);
  const rising = useMemo(() => risingIds(items, rankedAt), [items, rankedAt]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="ds-de-xuat">
        <h2 id="ds-de-xuat" className="sr-only">
          Danh sách đề xuất
        </h2>
        <SortTabs value={sort} onChange={setSort} />
        <div role="group" aria-label="Lọc theo trạng thái" className="mt-2 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)} className="min-h-9 px-3 py-1 text-xs">
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
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((s) => (
                // Reorders glide to their new place when the tab or the votes change (layout needs
                // the domMax feature bundle); reduced motion: items jump straight to the new order.
                <m.li key={s.id} layout={reduceMotion ? false : "position"} variants={rise} initial="hidden" animate="visible" exit="exit">
                  <SuggestionItem
                    suggestion={s}
                    voted={voted.has(s.id)}
                    onVote={() => vote(s.id)}
                    gameCover={s.linkedGameSlug ? covers?.[s.linkedGameSlug] : undefined}
                    fresh={s.status === "pending" && isFresh(s, rankedAt)}
                    rising={rising.has(s.id)}
                  />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="mt-4">
            {sort === "fan" ? (
              <EmptyState mascot="notify" title="Chưa có game Bộ Tộc tự làm nào ở mục này">
                Bạn hoặc người quen làm game? Đề xuất để anh Độ thử nhé.
              </EmptyState>
            ) : (
              <EmptyState mascot="notify" title="Chưa có đề xuất nào ở mục này">
                Hãy là người đầu tiên đề xuất một game cho anh Độ.
              </EmptyState>
            )}
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
