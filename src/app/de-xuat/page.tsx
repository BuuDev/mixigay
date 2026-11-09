import type { Metadata } from "next";
import { Suspense } from "react";
import { getViewer } from "@/features/auth/server/viewer";
import { SuggestionBoard } from "@/features/suggestions/components/suggestion-board";
import { getMyVoteIds, getSuggestions } from "@/features/suggestions/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { IconSuggest } from "@/shared/ui/icons.generated";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Đề xuất game – Tộc Đêm" };

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
  const votedIds = viewer ? await getMyVoteIds(viewer.id) : [];
  return <SuggestionBoard initial={suggestions} votedIds={votedIds} mode={isSupabaseConfigured ? "live" : "demo"} signedIn={Boolean(viewer)} />;
}
