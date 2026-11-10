import { Suspense } from "react";
import { HomePoll } from "@/features/polls/components/home-poll";
import { getWallMessages } from "@/features/wall/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { WallHighlights } from "./wall-highlights";

/**
 * "Góc tương tác": what YouTube doesn't give the community, right under the cover —
 * the poll and the latest notes on the wall. (The live reaction room and the "Tối nay
 * tôi có mặt" RSVP were removed to keep the site within free plans, ADR-019.)
 */
export async function InteractionHub() {
  const wall = (await getWallMessages()).slice(0, 6).map((w) => ({ id: w.id, body: w.body, author: w.author, verified: w.authorVerified }));
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
      <Suspense fallback={<div aria-hidden className="h-72 animate-pulse rounded-lg bg-surface" />}>
        <HomePoll headingLevel={3} className="h-full" />
      </Suspense>
      <WallHighlights messages={wall} demo={!isSupabaseConfigured} />
    </div>
  );
}
