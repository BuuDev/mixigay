"use client";

import { useState, useSyncExternalStore } from "react";
import { useLiveStatus } from "@/features/live/hooks/use-live-status";
import type { LiveStatus } from "@/features/live/types";
import { formatCountdown } from "@/features/schedule/lib/countdown";
import { DAY_NAMES, isOffDay, nextSlot } from "@/features/schedule/lib/schedule";
import { overrideFor, vnDateKey } from "@/features/schedule/lib/overrides";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import { useNow } from "@/shared/hooks/use-now";
import { useOverlayFlag } from "@/shared/hooks/use-overlay-flag";
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
export function IntroRitual({ status: initial, schedule, overrides }: { status: LiveStatus; schedule: ScheduleSlot[]; overrides?: ScheduleOverride[] }) {
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
            <p className="font-script text-2xl font-semibold text-accent-glow">Thiệp mời Bộ Tộc</p>
            <NeonText className="mt-2 text-3xl sm:text-4xl">GÓC BỘ TỘC</NeonText>
            <p className="mt-2 text-sm text-muted">Nhóm lửa trại, quây quần bên anh Độ — web fan tự làm</p>

            {/* Fixed box (fits the 240×160 unlit fire and the 192×192 lit scene) so nothing shifts between phases. */}
            <div className="relative mt-8 h-48 w-60">
              <AnimatePresence mode="wait" initial={false}>
                {phase === "unlit" ? (
                  <m.div key="unlit" exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 flex items-center justify-center">
                    <Illustration name="intro-unlit" width={240} />
                    {/* Warm the cache so the lit scene is ready the moment the fire flares. */}
                    <Mascot pose="campfire" size={192} decorative loading="eager" className="hidden" />
                  </m.div>
                ) : (
                  <m.div
                    key="lit"
                    className="absolute inset-0 flex items-center justify-center motion-safe:animate-td-flicker"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transition: {
                        duration: duration.ritual,
                        ease: [0.34, 1.56, 0.64, 1],
                      },
                    }}
                  >
                    <Mascot pose="campfire" size={192} decorative loading="eager" />
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
                    <TodayLine initial={initial} schedule={schedule} overrides={overrides} />
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
function TodayLine({ initial, schedule, overrides }: { initial: LiveStatus; schedule: ScheduleSlot[]; overrides?: ScheduleOverride[] }) {
  const status = useLiveStatus(initial);
  const now = useNow();
  if (!now) return null;

  if (status.state === "live" && status.videoId) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Mascot pose="live" size={88} decorative />
        <LiveBadge />
        <ButtonLink href={youtubeUrl(status.videoId)} external>
          Xem trên YouTube
        </ButtonLink>
      </div>
    );
  }

  const next = nextSlot(schedule, now, overrides);
  const today = overrideFor(overrides, vnDateKey(now));
  const upcomingAt = status.state === "upcoming" && status.startTime ? new Date(status.startTime) : next?.at;
  if (isOffDay(schedule, now, overrides) && status.state !== "upcoming") {
    return (
      <div className="flex flex-col items-center gap-2">
        <Mascot pose="sleep" size={88} decorative />
        <p className="text-lg font-bold">Hôm nay anh Độ nghỉ.</p>
        {next && (
          <p className="text-muted">
            Hẹn {next.slot.time} {DAY_NAMES[next.slot.dayOfWeek].toLowerCase()}.
          </p>
        )}
        <p className="text-xs text-muted">
          {today?.cancelled ? `Nghỉ đột xuất${today.note ? `: ${today.note}` : ""}` : "Lịch nghỉ cố định"} — anh em tranh thủ ngủ sớm hoặc cày lại Phòng Trà An
          Liễng nhé.
        </p>
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
      <p className="text-xs text-muted">Chuẩn bị trà đá, kê ghế đợi {status.state !== "upcoming" && next ? next.slot.time : "giờ"} lên sóng.</p>
    </div>
  );
}
