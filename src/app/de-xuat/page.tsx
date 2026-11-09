import type { Metadata } from "next";
import { Suspense } from "react";
import { getViewer } from "@/features/auth/server/viewer";
import { SuggestionBoard } from "@/features/suggestions/components/suggestion-board";
import { getMyPendingSuggestions, getMyVoteIds, getSuggestions } from "@/features/suggestions/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { IconSuggest } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Đề xuất game – Góc Bộ Tộc" };

export default function SuggestPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Fan đề xuất game" icon={<IconSuggest size={26} className="text-accent" />} />
      <Suspense fallback={<p className="text-sm text-muted">Đang tải đề xuất…</p>}>
        <Board />
      </Suspense>
    </div>
  );
}

/** Dynamic part: the viewer's session and votes. */
async function Board() {
  const [suggestions, viewer] = await Promise.all([getSuggestions(), getViewer()]);
  const [votedIds, pending] = viewer ? await Promise.all([getMyVoteIds(viewer.id), getMyPendingSuggestions(viewer.id)]) : [[], []];
  return (
    <SuggestionBoard
      initial={suggestions}
      votedIds={votedIds}
      pending={pending}
      mode={isSupabaseConfigured ? "live" : "demo"}
      signedIn={Boolean(viewer)}
    />
  );
}
