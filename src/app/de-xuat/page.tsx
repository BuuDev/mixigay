import type { Metadata } from "next";
import { Suspense } from "react";
import { SuggestionBoard } from "@/components/suggestion-board";
import { getMyVoteIds, getViewer } from "@/lib/auth";
import { getSuggestions } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Đề xuất game – Góc Fan Độ" };

export default function SuggestPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fan đề xuất game</h1>
      <Suspense fallback={<p className="text-sm text-muted">Đang tải đề xuất…</p>}>
        <Board />
      </Suspense>
    </div>
  );
}

async function Board() {
  const [suggestions, viewer] = await Promise.all([getSuggestions(), getViewer()]);
  const votedIds = viewer ? await getMyVoteIds(viewer.id) : [];
  return (
    <SuggestionBoard
      initial={suggestions}
      votedIds={votedIds}
      mode={isSupabaseConfigured ? "live" : "demo"}
      signedIn={Boolean(viewer)}
    />
  );
}
