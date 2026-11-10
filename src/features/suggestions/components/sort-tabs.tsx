"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Chip } from "@/shared/ui/chip";
import { DEFAULT_SORT, parseSortMode, SORT_MODES, type SortMode } from "../lib/ranking";
import { SORT_LABEL } from "./labels";

/**
 * Sort mode kept in `?sort=` so a tab can be shared. Sorting happens in the browser on
 * data already loaded, so the URL is written with history.replaceState (Next keeps
 * useSearchParams in sync) instead of router.replace, which would refetch the page.
 * useSearchParams needs a <Suspense> above it (the board already sits in one).
 */
export function useSortParam(): [SortMode, (mode: SortMode) => void] {
  const params = useSearchParams();
  const [sort, setSort] = useState<SortMode>(() => parseSortMode(params.get("sort")));

  function change(mode: SortMode) {
    setSort(mode);
    const next = new URLSearchParams(window.location.search);
    if (mode === DEFAULT_SORT) next.delete("sort");
    else next.set("sort", mode);
    const query = next.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }

  return [sort, change];
}

export function SortTabs({ value, onChange }: { value: SortMode; onChange: (mode: SortMode) => void }) {
  return (
    <div role="group" aria-label="Sắp xếp đề xuất" className="flex flex-wrap gap-2">
      {SORT_MODES.map((mode) => (
        <Chip key={mode} active={value === mode} onClick={() => onChange(mode)} className="font-semibold">
          {SORT_LABEL[mode]}
        </Chip>
      ))}
    </div>
  );
}
