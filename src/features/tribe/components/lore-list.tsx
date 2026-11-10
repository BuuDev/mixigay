"use client";

import { ReportButton } from "@/features/reports/components/report-button";
import { useState } from "react";
import { AnimatePresence, m, rise } from "@/shared/motion";
import { Badge } from "@/shared/ui/badge";
import { Chip } from "@/shared/ui/chip";
import { LORE, LORE_GROUPS, type LoreGroup } from "../lib/lore";

/** An approved fan-contributed entry ("Fan góp"), shown after the curated ones. */
export interface FanLoreEntry {
  id: string;
  term: string;
  meaning: string;
  sourceUrl: string;
  sourceLabel: string;
  author: string;
  authorId?: string;
}

/**
 * "Kho biệt danh & từ điển": a deck filtered by group. Each entry is a native
 * <details> (expandable without extra JS) and always shows its source.
 * `fanEntries` (already de-duplicated against LORE) follow the curated deck.
 */
export function LoreList({ fanEntries = [] }: { fanEntries?: FanLoreEntry[] }) {
  const [group, setGroup] = useState<LoreGroup | "all" | "fan">("all");
  const shown = LORE.filter((e) => group === "all" || e.group === group);
  const fanShown = group === "all" || group === "fan" ? fanEntries : [];
  const count = (g: LoreGroup) => LORE.filter((e) => e.group === g).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        <Chip active={group === "all"} onClick={() => setGroup("all")}>
          Tất cả <span className="font-normal">{LORE.length + fanEntries.length}</span>
        </Chip>
        {LORE_GROUPS.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            {g.label} <span className="font-normal">{count(g.id)}</span>
          </Chip>
        ))}
        {fanEntries.length > 0 && (
          <Chip active={group === "fan"} onClick={() => setGroup("fan")}>
            Fan góp <span className="font-normal">{fanEntries.length}</span>
          </Chip>
        )}
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((e) => (
            <m.details key={e.term} variants={rise} initial="hidden" animate="visible" exit="exit" className="group px-4 py-3 open:bg-surface-raised">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold marker:hidden">
                <span>
                  {e.term} {e.unverified && <Badge tone="muted">chưa rõ nghĩa</Badge>}
                </span>
                <span aria-hidden className="text-muted transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm">{e.meaning}</p>
              <a href={e.source.href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline">
                Nguồn: {e.source.label} ↗
              </a>
            </m.details>
          ))}
          {fanShown.map((e) => (
            <m.details key={`fan-${e.id}`} variants={rise} initial="hidden" animate="visible" exit="exit" className="group px-4 py-3 open:bg-surface-raised">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold marker:hidden">
                <span>
                  {e.term} <Badge tone="viewer">Fan góp</Badge>
                </span>
                <span aria-hidden className="text-muted transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm break-words">{e.meaning}</p>
              <div className="mt-1 text-xs text-muted">
                Góp bởi {e.author} ·{" "}
                <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-accent hover:underline">
                  Nguồn: {e.sourceLabel} ↗
                </a>
                {e.authorId && (
                  <>
                    {" "}
                    · <ReportButton kind="glossary_entry" targetId={e.id} authorId={e.authorId} />
                  </>
                )}
              </div>
            </m.details>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
