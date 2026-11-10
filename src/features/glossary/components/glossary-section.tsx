import { Suspense } from "react";
import { LoreList } from "@/features/tribe/components/lore-list";
import { LORE } from "@/features/tribe/lib/lore";
import { withoutCuratedTerms } from "../lib/terms";
import { getGlossaryEntries } from "../server/queries";
import { GlossaryComposer, GlossarySignInCard } from "./glossary-composer";

/** "Từ điển Bộ Tộc": curated deck + approved fan entries (cached), and the per-viewer contribution form under <Suspense>. */
export async function GlossarySection() {
  const approved = withoutCuratedTerms(
    await getGlossaryEntries(),
    LORE.map((e) => e.term),
  );
  // Only what the deck renders crosses to the client (the author id is needed for "Báo cáo").
  const fanEntries = approved.map(({ id, term, meaning, sourceUrl, sourceLabel, author, authorId }) => ({ id, term, meaning, sourceUrl, sourceLabel, author, authorId }));
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <LoreList fanEntries={fanEntries} />
      <div className="self-start lg:sticky lg:top-20">
        <Suspense fallback={<GlossarySignInCard />}>
          <GlossaryComposer />
        </Suspense>
      </div>
    </div>
  );
}
