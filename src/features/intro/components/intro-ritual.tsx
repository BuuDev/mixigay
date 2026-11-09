"use client";

import { useState, useSyncExternalStore } from "react";
import { useLiveStatus } from "@/features/live/hooks/use-live-status";
import type { LiveStatus } from "@/features/live/types";
import { formatCountdown } from "@/features/schedule/lib/countdown";
import { DAY_NAMES, isOffDay, nextSlot } from "@/features/schedule/lib/schedule";
import type { ScheduleSlot } from "@/features/schedule/types";
import { useNow } from "@/shared/hooks/use-now";
import { useOverlayFlag } from "@/shared/hooks/use-overlay-flag";
import { formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { AnimatePresence, duration, m, pop, rise, useReducedMotion } from "@/shared/motion";
import { Burst } from "@/shared/motion/burst";
import { Embers } from "@/shared/motion/embers";
import { LiveBadge } from "@/shared/ui/badge";
import { Illustration, Mascot } from "@/shared/ui/brand-art";
import { Button, ButtonLink } from "@/shared/ui/button";
import { NeonText } from "@/shared/ui/neon-text";
import { Portal } from "@/shared/ui/portal";
import { markSeen, seenToday } from "../lib/intro";

type Phase = "unlit" | "lighting" | "status" | "closed";

// Read once per page load; the server snapshot says "seen" so nothing renders on the server.
const subscribe = () => () => {};
const seenSnapshot = () => seenToday(window.localStorage, new Date());
const seenOnServer = () => true;

/**
 * Spec §1 — the site's one big moment. unlit → "Nhóm lửa" → the flame flares
 * (600–900 ms) → one line about today (live / countdown / day off). Once per
 * device per Vietnam day, always skippable; reduced motion jumps to the end.
 */
export function IntroRitual({ status: initial, schedule }: { status: LiveStatus; schedule: ScheduleSlot[] }) {
  const seen = useSyncExternalStore(subscribe, seenSnapshot, seenOnServer);
  const [phase, setPhase] = useState<Phase>("unlit");
  const reduce = useReducedMotion();
  const open = !seen && phase !== "closed";

  useOverlayFlag(open);

  function close() {
    markSeen(window.localStorage, new Date());
    setPhase("closed");
  }

  function kindle() {
    if (reduce) {
      setPhase("status");
      return;
    }
    setPhase("lighting");
    // Only advance if the visitor has not skipped meanwhile.
    setTimeout(() => setPhase((p) => (p === "lighting" ? "status" : p)), duration.ritual * 1000);
  }

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <m.div
            key="intro"
            role="dialog"
            aria-modal="true"
            aria-label="Màn nhóm lửa"
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-background px-6 text-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: duration.slow } }}
          >
            {phase === "status" && <Embers count={16} />}
            <NeonText className="text-3xl sm:text-4xl">TỘC ĐÊM</NeonText>
            <p className="mt-2 text-sm text-muted">Lửa trại của Bộ tộc — web fan tự làm</p>

            <div className="relative mt-8 h-40 w-60">
              <AnimatePresence mode="wait" initial={false}>
                {phase === "unlit" ? (
                  <m.div key="unlit" exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0">
                    <Illustration name="intro-unlit" width={240} />
                  </m.div>
                ) : (
                  <m.div
                    key="lit"
                    className="absolute inset-0 motion-safe:animate-td-flicker"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1, transition: { duration: duration.ritual, ease: [0.34, 1.56, 0.64, 1] } }}
                  >
                    <Illustration name="intro-lit" width={240} />
                  </m.div>
                )}
              </AnimatePresence>
              {phase === "lighting" && <Burst count={18} distance={120} />}
            </div>

            <div className="mt-8 min-h-40 w-full max-w-sm">
              <AnimatePresence mode="wait">
                {phase === "unlit" && (
                  <m.div key="cta" variants={rise} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center gap-3">
                    <Button size="lg" onClick={kindle} autoFocus>
                      🔥 Nhóm lửa
                    </Button>
                    <button type="button" onClick={close} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
                      Vào thẳng
                    </button>
                  </m.div>
                )}
                {phase === "status" && (
                  <m.div key="status" variants={pop} initial="hidden" animate="visible" className="flex flex-col items-center gap-4">
                    <TodayLine initial={initial} schedule={schedule} />
                    <Button variant="secondary" onClick={close}>
                      Vào trang
                    </Button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            {phase !== "status" && (
              <button type="button" onClick={close} className="absolute top-4 right-4 rounded-pill px-3 py-1 text-sm text-muted hover:text-foreground">
                Bỏ qua
              </button>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/** The single status line shown once the fire is lit. */
function TodayLine({ initial, schedule }: { initial: LiveStatus; schedule: ScheduleSlot[] }) {
  const status = useLiveStatus(initial);
  const now = useNow();
  if (!now) return null;

  if (status.state === "live" && status.videoId) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Mascot pose="live" size={88} decorative />
        <LiveBadge viewers={status.concurrentViewers ? formatViews(status.concurrentViewers) : undefined} />
        <ButtonLink href={youtubeUrl(status.videoId)} external>
          Xem trên YouTube
        </ButtonLink>
      </div>
    );
  }

  const next = nextSlot(schedule, now);
  const upcomingAt = status.state === "upcoming" && status.startTime ? new Date(status.startTime) : next?.at;
  if (isOffDay(schedule, now) && status.state !== "upcoming") {
    return (
      <div className="flex flex-col items-center gap-2">
        <Mascot pose="sleep" size={88} decorative />
        <p className="text-lg font-bold">Hôm nay Độ nghỉ.</p>
        {next && (
          <p className="text-muted">
            Hẹn {next.slot.time} {DAY_NAMES[next.slot.dayOfWeek].toLowerCase()}.
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <Mascot pose="wait" size={88} decorative />
      {upcomingAt && (
        <p className="text-lg font-bold">
          Còn <span className="font-mono tabular-nums">{formatCountdown(upcomingAt.getTime() - now.getTime())}</span> nữa
        </p>
      )}
    </div>
  );
}
