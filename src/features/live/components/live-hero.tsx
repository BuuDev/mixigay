"use client";

import { isOffDay, nextSlot } from "@/features/schedule/lib/schedule";
import { overrideFor, vnDateKey } from "@/features/schedule/lib/overrides";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import { useNow } from "@/shared/hooks/use-now";
import { AnimatePresence, m, rise } from "@/shared/motion";
import { Embers } from "@/shared/motion/embers";
import { Card } from "@/shared/ui/card";
import { useLiveStatus } from "../hooks/use-live-status";
import type { LiveStatus } from "../types";
import { LiveNow } from "./live-now";
import { NextStream, OffDay } from "./next-stream";
import { UpcomingStream } from "./upcoming-stream";

type View = "live" | "upcoming" | "next" | "offday" | "loading";

function pickView(status: LiveStatus, schedule: ScheduleSlot[], now: Date | null, overrides?: ScheduleOverride[]): View {
  if (status.state === "live" && status.videoId) return "live";
  if (status.state === "upcoming" && status.videoId && status.startTime) return "upcoming";
  if (!now) return "loading";
  return isOffDay(schedule, now, overrides) ? "offday" : "next";
}

/**
 * The status block: live now → upcoming premiere → countdown to the next
 * scheduled slot → day off. Starts from the server's status and follows Supabase
 * Realtime; each change cross-fades (AnimatePresence) instead of jumping.
 * `embers` adds the background particles (home page only, spec §10).
 */
export function LiveHero({
  status: initial,
  schedule,
  overrides,
  embers = false,
}: {
  status: LiveStatus;
  schedule: ScheduleSlot[];
  overrides?: ScheduleOverride[];
  embers?: boolean;
}) {
  const now = useNow();
  const status = useLiveStatus(initial);
  const view = pickView(status, schedule, now, overrides);
  const next = now ? nextSlot(schedule, now, overrides) : null;
  const today = now ? overrideFor(overrides, vnDateKey(now)) : undefined;

  return (
    <>
      {embers && <Embers live={view === "live"} />}
      <Card className="relative overflow-hidden p-5 sm:p-6" aria-live="polite">
        {/* The hydration placeholder stays outside AnimatePresence: swapping it for the real
            view in the commit right after hydration left mode="wait" stuck on the placeholder. */}
        {view === "loading" ? (
          <div className="h-32" />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={view} variants={rise} initial="hidden" animate="visible" exit="exit">
              {view === "live" && <LiveNow status={status} now={now} />}
              {view === "upcoming" && <UpcomingStream status={status} now={now} />}
              {view === "next" && next && now && <NextStream slot={next.slot} at={next.at} now={now} override={next.override} />}
              {view === "offday" && <OffDay next={next} today={today} />}
            </m.div>
          </AnimatePresence>
        )}
      </Card>
    </>
  );
}
