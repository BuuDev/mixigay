"use client";

import { useState } from "react";
import { AnimatePresence, m, rise } from "@/shared/motion";
import { Badge } from "@/shared/ui/badge";
import { Chip } from "@/shared/ui/chip";
import { LORE, LORE_GROUPS, type LoreGroup } from "../lib/lore";

/**
 * "Kho biệt danh & từ điển": a deck filtered by group. Each entry is a native
 * <details> (expandable without extra JS) and always shows its source.
 */
export function LoreList() {
  const [group, setGroup] = useState<LoreGroup | "all">("all");
  const shown = LORE.filter((e) => group === "all" || e.group === group);
  const count = (g: LoreGroup) => LORE.filter((e) => e.group === g).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        <Chip active={group === "all"} onClick={() => setGroup("all")}>
          Tất cả <span className="font-normal">{LORE.length}</span>
        </Chip>
        {LORE_GROUPS.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            {g.label} <span className="font-normal">{count(g.id)}</span>
          </Chip>
        ))}
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
        </AnimatePresence>
      </div>
    </div>
  );
}
