"use client";

import { useEffect, useRef, useState } from "react";
import { useNow } from "@/shared/hooks/use-now";
import { AnimatePresence, m, pop } from "@/shared/motion";
import { cn } from "@/shared/ui/cn";
import { IconOffday } from "@/shared/ui/icons.generated";
import { googleCalendarLink, monthGrid, slotInstant, vnDate, type DayCell } from "../lib/calendar";
import type { ScheduleSlot } from "../types";

const HEAD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/**
 * Spec §2 — month view (Vietnam calendar). Stream days get an ember dot, days off
 * a muted dot, today a cream ring; tapping a day opens a popover with its times
 * and "Thêm vào lịch". Months slide horizontally when switching.
 */
export function MonthCalendar({ schedule }: { schedule: ScheduleSlot[] }) {
  const now = useNow();
  const [offset, setOffset] = useState(0);
  const [dir, setDir] = useState(1);
  const [picked, setPicked] = useState<DayCell | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // Escape or a tap outside the calendar closes the day popover.
  useEffect(() => {
    if (!picked) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicked(null);
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setPicked(null);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [picked]);

  if (!now) return <div className="h-80" />;
  const base = vnDate(now);
  const month = new Date(Date.UTC(base.y, base.m + offset, 1));
  const weeks = monthGrid(month.getUTCFullYear(), month.getUTCMonth(), schedule, now);
  const go = (d: number) => {
    setDir(d);
    setOffset((o) => o + d);
    setPicked(null);
  };

  return (
    <div ref={box} className="relative mx-auto w-full max-w-md rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} disabled={offset <= 0} aria-label="Tháng trước" className="rounded-pill px-3 py-1 text-muted hover:text-foreground disabled:opacity-30">
          ‹
        </button>
        <p className="font-bold capitalize">{month.toLocaleDateString("vi-VN", { month: "long", year: "numeric", timeZone: "UTC" })}</p>
        <button type="button" onClick={() => go(1)} disabled={offset >= 2} aria-label="Tháng sau" className="rounded-pill px-3 py-1 text-muted hover:text-foreground disabled:opacity-30">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted">
        {HEAD.map((h) => (
          <div key={h} className="py-1">
            {h}
          </div>
        ))}
      </div>
      <div className="overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <m.div
            key={offset}
            custom={dir}
            initial={{ x: dir * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -40, opacity: 0 }}
            className="grid grid-cols-7 gap-1"
          >
            {weeks.flat().map((cell) => {
              const streams = cell.slots.length > 0;
              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  disabled={!cell.inMonth}
                  onClick={() => setPicked(cell)}
                  aria-label={`${cell.date.getUTCDate()}: ${streams ? `stream ${cell.slots.map((s) => s.time).join(", ")}` : "ngày nghỉ"}`}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-md text-sm transition-colors",
                    !cell.inMonth && "invisible",
                    cell.isToday && "ring-2 ring-foreground",
                    picked?.date.getTime() === cell.date.getTime() ? "bg-accent/20" : "hover:bg-surface-raised",
                  )}
                >
                  <span className={cn(streams ? "font-bold" : "text-muted")}>{cell.date.getUTCDate()}</span>
                  <span aria-hidden className={cn("mt-0.5 size-1.5 rounded-full", streams ? "bg-accent shadow-[0_0_6px_var(--td-ember)]" : "bg-muted/40")} />
                </button>
              );
            })}
          </m.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {picked && (
          <m.div
            key={picked.date.toISOString()}
            variants={pop}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-label={`Ngày ${picked.date.getUTCDate()}`}
            className="absolute inset-x-4 bottom-4 z-10 rounded-md border border-border bg-surface-raised p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold">{picked.date.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" })}</p>
              <button type="button" onClick={() => setPicked(null)} aria-label="Đóng" className="text-xl leading-none text-muted hover:text-foreground">
                ×
              </button>
            </div>
            {picked.slots.length ? (
              <ul className="mt-2 space-y-2">
                {picked.slots.map((s) => {
                  const at = slotInstant(picked.date, s);
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        <span className="font-mono font-bold">{s.time}</span> {s.title}
                      </span>
                      <a
                        href={googleCalendarLink({ title: `Độ Mixi live: ${s.title}`, start: at })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-accent hover:underline"
                      >
                        Thêm vào lịch
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <IconOffday size={16} /> Ngày nghỉ theo lịch thường lệ.
              </p>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
