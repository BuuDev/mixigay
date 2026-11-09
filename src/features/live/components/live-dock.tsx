"use client";

import Link from "next/link";
import { formatCountdown } from "@/features/schedule/lib/countdown";
import { nextSlot } from "@/features/schedule/lib/schedule";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import { useNow } from "@/shared/hooks/use-now";
import { formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { m, pop, press } from "@/shared/motion";
import { CountUp } from "@/shared/motion/count-up";
import { IconUpcoming } from "@/shared/ui/icons";
import { useLiveStatus } from "../hooks/use-live-status";
import type { LiveStatus } from "../types";

/** Equalizer bars that dance while live (CSS; still under reduced motion). */
function Equalizer() {
  return (
    <span aria-hidden className="flex h-4 items-end gap-0.5">
      {[0, 0.2, 0.4, 0.1].map((delay, i) => (
        <span key={i} className="h-full w-[3px] origin-bottom rounded-sm bg-white motion-safe:animate-td-eq" style={{ animationDelay: `${delay}s` }} />
      ))}
    </span>
  );
}

/**
 * Spec §3 — always-visible floating button, bottom right. Live: red, viewers,
 * opens the stream on YouTube. Idle: short countdown, scrolls to the countdown
 * block. Hidden while the intro ritual is open (.td-dock in motion.css).
 */
export function LiveDock({ status: initial, schedule, overrides }: { status: LiveStatus; schedule: ScheduleSlot[]; overrides?: ScheduleOverride[] }) {
  const status = useLiveStatus(initial);
  const now = useNow();
  if (!now) return null;

  if (status.state === "live" && status.videoId) {
    return (
      <m.div
        variants={pop}
        initial="hidden"
        animate="visible"
        className="td-dock fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 lg:bottom-4"
      >
        <span aria-hidden className="absolute inset-0 rounded-pill bg-live motion-safe:animate-td-ping" />
        <m.a
          {...press}
          href={youtubeUrl(status.videoId)}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center gap-2 rounded-pill bg-live-fill px-4 py-2.5 text-sm font-bold text-white shadow-card"
        >
          <Equalizer />
          ĐANG LIVE
          {status.concurrentViewers ? (
            <span className="font-mono tabular-nums">
              · <CountUp value={status.concurrentViewers} format={(n) => formatViews(n)} />
            </span>
          ) : null}
          <span className="sr-only">(mở YouTube ở tab mới)</span>
        </m.a>
      </m.div>
    );
  }

  const target = status.state === "upcoming" && status.startTime ? Date.parse(status.startTime) : nextSlot(schedule, now, overrides)?.at.getTime();
  if (!target) return null;
  const left = formatCountdown(target - now.getTime());
  return (
    <m.div variants={pop} initial="hidden" animate="visible" className="td-dock fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 lg:bottom-4">
      <Link
        href="/#dem-nguoc"
        className="flex items-center gap-2 rounded-pill border border-border bg-surface-raised/95 px-4 py-2.5 text-sm font-semibold shadow-card backdrop-blur transition-transform hover:-translate-y-0.5"
        aria-label={`Buổi stream kế tiếp sau ${left}`}
      >
        <IconUpcoming size={16} className="text-accent" />
        <span className="font-mono tabular-nums">{left.replace(/:\d{2}$/, "")}</span>
      </Link>
    </m.div>
  );
}
