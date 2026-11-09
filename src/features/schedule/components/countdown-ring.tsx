"use client";

import { useNow } from "@/shared/hooks/use-now";
import { m } from "@/shared/motion";
import { buttonClass } from "@/shared/ui/button";
import { countdownProgress, googleCalendarLink } from "../lib/calendar";
import { formatCountdown } from "../lib/countdown";
import { DAY_NAMES, nextSlot } from "../lib/schedule";
import type { ScheduleOverride, ScheduleSlot } from "../types";

const R = 88;
const C = 2 * Math.PI * R;

/**
 * Spec §2 — the home page's core block: a ring that fills as the next stream
 * approaches, big H:M:S, a poster-style date block, and "Thêm vào lịch".
 */
export function CountdownRing({ schedule, overrides }: { schedule: ScheduleSlot[]; overrides?: ScheduleOverride[] }) {
  const now = useNow();
  const next = now ? nextSlot(schedule, now, overrides) : null;
  const progress = now ? countdownProgress(schedule, now, overrides) : 0;
  const text = now && next ? formatCountdown(next.at.getTime() - now.getTime()) : "--:--:--";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative size-60 sm:size-72">
        <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--td-line)" strokeWidth="8" />
          <m.circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="var(--td-ember)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - progress) }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: "drop-shadow(0 0 6px var(--td-ember))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center" role="timer" aria-live="off">
          <span className="text-xs tracking-[0.25em] text-muted uppercase">Còn</span>
          <span className="font-mono text-3xl font-black tracking-tight tabular-nums sm:text-4xl">{text}</span>
          {next && (
            <span className="mt-1 text-sm text-muted">
              {next.at.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ·{" "}
              {next.at.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {next && (
        <>
          <DateBlock day={DAY_NAMES[next.slot.dayOfWeek]} date={next.at} time={next.slot.time} />
          <p className="max-w-xs text-center font-semibold">{next.slot.title}</p>
          {next.override?.note && <p className="-mt-4 max-w-xs text-center text-sm text-muted">{next.override.note}</p>}
          <a
            href={googleCalendarLink({
              title: `Anh Độ Mixi live: ${next.slot.title}`,
              start: next.at,
              details: "Nhắc từ Góc Bộ Tộc (web fan). Xem trên Kênh MixiGaming (YouTube).",
            })}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary")}
          >
            📅 Thêm vào lịch
          </a>
        </>
      )}
    </div>
  );
}

/** "THỨ NĂM │ 12 │ 22:22" with a big outlined numeral, poster style. */
function DateBlock({ day, date, time }: { day: string; date: Date; time: string }) {
  const dd = date.toLocaleDateString("vi-VN", { day: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
  const mm = date.toLocaleDateString("vi-VN", { month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
  return (
    <div className="flex items-center gap-4 text-sm font-semibold tracking-[0.2em] text-muted uppercase">
      <span>{day}</span>
      <span aria-hidden className="h-8 w-px bg-border" />
      <span className="text-5xl font-black tracking-tight text-transparent [-webkit-text-stroke:1.5px_var(--td-ember)]">{dd}</span>
      <span aria-hidden className="h-8 w-px bg-border" />
      <span>
        {time} · T{Number(mm)}
      </span>
    </div>
  );
}
