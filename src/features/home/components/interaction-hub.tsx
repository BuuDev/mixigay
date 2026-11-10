import { Suspense } from "react";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import { AttendanceBlock } from "@/features/attendance/components/attendance-block";
import { HomePoll } from "@/features/polls/components/home-poll";
import { TribeRoom } from "@/features/tribe-room/components/tribe-room";
import { getWallMessages } from "@/features/wall/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { MountWhenVisible } from "./mount-when-visible";
import { WallHighlights } from "./wall-highlights";

/**
 * "Góc tương tác": what YouTube doesn't give the community, right under the cover —
 * the live room (who is here + reactions), the poll, tonight's RSVP with the personal
 * streak, and the latest notes on the wall.
 */
export async function InteractionHub({ live, schedule, overrides }: { live: boolean; schedule: ScheduleSlot[]; overrides: ScheduleOverride[] }) {
  const wall = (await getWallMessages()).slice(0, 6).map((w) => ({ id: w.id, body: w.body, author: w.author, verified: w.authorVerified }));
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <MountWhenVisible minHeight={280}>
          <TribeRoom live={live} className="h-full" headingLevel={3} />
        </MountWhenVisible>
        <Suspense fallback={<div aria-hidden className="h-72 animate-pulse rounded-lg bg-surface" />}>
          <HomePoll headingLevel={3} className="h-full" />
        </Suspense>
      </div>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <AttendanceBlock schedule={schedule} overrides={overrides} />
        <WallHighlights messages={wall} demo={!isSupabaseConfigured} />
      </div>
    </div>
  );
}
