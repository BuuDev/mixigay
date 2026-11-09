import type { ScheduleSlot } from "../types";
import { nextOccurrence } from "./schedule";

const VN_MS = 7 * 3_600_000;
const DAY_MS = 86_400_000;

/** Vietnam calendar date (y, m 0-based, d) of an instant. */
export function vnDate(at: Date): { y: number; m: number; d: number } {
  const v = new Date(at.getTime() + VN_MS);
  return { y: v.getUTCFullYear(), m: v.getUTCMonth(), d: v.getUTCDate() };
}

export interface DayCell {
  /** UTC midnight of the Vietnam calendar day — use only for y/m/d. */
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  /** Regular slots that day (Vietnam time). */
  slots: ScheduleSlot[];
}

/** Monday-first weeks covering a month in the Vietnam calendar. */
export function monthGrid(year: number, month: number, slots: ScheduleSlot[], now: Date): DayCell[][] {
  const today = vnDate(now);
  const first = Date.UTC(year, month, 1);
  const lead = (new Date(first).getUTCDay() + 6) % 7; // Monday = 0
  const start = first - lead * DAY_MS;
  const weeks: DayCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start + (w * 7 + i) * DAY_MS);
      week.push({
        date,
        inMonth: date.getUTCMonth() === month,
        isToday: date.getUTCFullYear() === today.y && date.getUTCMonth() === today.m && date.getUTCDate() === today.d,
        slots: slots.filter((s) => s.dayOfWeek === date.getUTCDay()),
      });
    }
    if (w >= 4 && week.every((c) => !c.inMonth)) break;
    weeks.push(week);
  }
  return weeks;
}

/** UTC instant of a slot on a given Vietnam calendar day. */
export function slotInstant(day: Date, slot: ScheduleSlot): Date {
  const [h, m] = slot.time.split(":").map(Number);
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m) - VN_MS);
}

/**
 * 0→1 progress of the wait between the previous scheduled start and the next one,
 * for the countdown ring. 0 right after a stream started, 1 when the next begins.
 */
export function countdownProgress(slots: ScheduleSlot[], now: Date): number {
  if (!slots.length) return 0;
  const nexts = slots.map((s) => nextOccurrence(s, now).getTime());
  const next = Math.min(...nexts);
  const prev = Math.max(...nexts.map((t) => t - 7 * DAY_MS));
  return Math.min(1, Math.max(0, (now.getTime() - prev) / (next - prev)));
}

const gcalTime = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** "Add to Google Calendar" link (no OAuth, opens Google's own form). */
export function googleCalendarLink({ title, start, minutes = 180, details }: { title: string; start: Date; minutes?: number; details?: string }): string {
  const end = new Date(start.getTime() + minutes * 60_000);
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${gcalTime(start)}/${gcalTime(end)}` });
  if (details) params.set("details", details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
