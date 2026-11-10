import type { Metadata } from "next";
import { Suspense } from "react";
import { getViewer } from "@/features/auth/server/viewer";
import { SuggestionBoard } from "@/features/suggestions/components/suggestion-board";
import { getMyPendingSuggestions, getMyVoteIds, getSuggestions } from "@/features/suggestions/server/queries";
import { gameCoverRecord } from "@/features/videos/lib/game-cover";
import { getVideos } from "@/features/videos/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { SceneArt } from "@/shared/ui/brand-art";
import { IconSuggest } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Đề xuất game – Góc Bộ Tộc" };

export default function SuggestPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Fan đề xuất game" icon={<IconSuggest size={26} className="text-accent" />} art={<SceneArt scene="09-tro-choi" size={128} />} />
      <Suspense fallback={<p className="text-sm text-muted">Đang tải đề xuất…</p>}>
        <Board />
      </Suspense>
    </div>
  );
}

/** Dynamic part: the viewer's session and votes. */
async function Board() {
  const [suggestions, viewer, videos] = await Promise.all([getSuggestions(), getViewer(), getVideos()]);
  // Only the covers of linked games reach the client, not the whole video list.
  const linked = suggestions.flatMap((s) => (s.linkedGameSlug ? [s.linkedGameSlug] : []));
  const covers = gameCoverRecord(videos.filter((v) => linked.includes(v.gameSlug)));
  const [votedIds, pending] = viewer ? await Promise.all([getMyVoteIds(viewer.id), getMyPendingSuggestions(viewer.id)]) : [[], []];
  return (
    <SuggestionBoard
      initial={suggestions}
      votedIds={votedIds}
      pending={pending}
      mode={isSupabaseConfigured ? "live" : "demo"}
      signedIn={Boolean(viewer)}
      covers={covers}
    />
  );
}
