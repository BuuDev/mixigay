"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { checkSourceUrl } from "../lib/source";
import type { GlossaryEntry } from "../types";
import { PendingGlossaryCard } from "./glossary-entry-card";
import { draftIsValid, EMPTY_DRAFT, GlossaryFields, type GlossaryDraft } from "./glossary-fields";

/** Mock mode (no Supabase): submissions only live in this browser tab and never join the public deck. */
export function GlossaryDemo() {
  const [mine, setMine] = useState<GlossaryEntry[]>([]);
  const [draft, setDraft] = useState<GlossaryDraft>(EMPTY_DRAFT);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const source = checkSourceUrl(draft.sourceUrl);
    if (!draftIsValid(draft) || !source.ok) return;
    const entry: GlossaryEntry = {
      id: crypto.randomUUID(),
      term: draft.term.trim(),
      meaning: draft.meaning.trim(),
      sourceUrl: source.url,
      sourceLabel: source.label,
      author: "bạn",
      authorVerified: false,
      createdAt: new Date().toISOString(),
      approved: false,
    };
    setMine((prev) => [entry, ...prev]);
    setDraft(EMPTY_DRAFT);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={submit} className="space-y-3">
          <h3 className="font-semibold">Góp từ cho từ điển</h3>
          <p className="text-xs text-muted">Chế độ demo (chưa nối Supabase): mục từ chỉ lưu tạm trên trình duyệt này.</p>
          <GlossaryFields value={draft} onChange={setDraft} />
          <Button type="submit" disabled={!draftIsValid(draft)} className="w-full">
            Gửi mục từ chờ duyệt
          </Button>
        </form>
      </Card>
      {mine.length > 0 && <PendingList entries={mine} />}
    </div>
  );
}

export function PendingList({ entries }: { entries: GlossaryEntry[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Mục từ của bạn đang chờ duyệt</h3>
      <p className="text-xs text-muted">Chỉ bạn thấy mục này. Mục từ hiện công khai sau khi admin duyệt.</p>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id}>
            <PendingGlossaryCard entry={e} />
          </li>
        ))}
      </ul>
    </div>
  );
}
