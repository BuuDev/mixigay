import type { NextStreamSlot, ScheduleOverride, ScheduleSlot } from "../types";
import { dayKey, effectiveSlots, instantOn, isChange, overrideFor, vnDateKey, vnDay } from "./overrides";

const DAY_MS = 86_400_000;

export type WeekRowKind = "regular" | "changed" | "cancelled" | "extra";

export interface WeekRow {
  /** Unique per row: date + slot id. */
  key: string;
  /** "YYYY-MM-DD" Vietnam date. */
  dateVn: string;
  /** UTC midnight of that Vietnam day — use only for y/m/d. */
  day: Date;
  /** The slot as it happens (moved time/title applied); the regular slot when cancelled. */
  slot: ScheduleSlot;
  /** UTC start instant on that day. */
  at: Date;
  kind: WeekRowKind;
  /** Regular slot replaced by a "changed" row. */
  original?: ScheduleSlot;
  override?: ScheduleOverride;
}

/** Monday 00:00 (as a UTC-midnight y/m/d) of the Vietnam week containing `now`. */
export function weekStart(now: Date): Date {
  const today = vnDay(now);
  return new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY_MS);
}

/**
 * This Vietnam week (Monday → Sunday) as rows: regular slots, with the week's
 * overrides applied — cancelled slots stay listed (marked), moved slots show the
 * new time, and extra streams on days off get their own row.
 */
export function weekRows(slots: ScheduleSlot[], now: Date, overrides?: readonly ScheduleOverride[]): WeekRow[] {
  const monday = weekStart(now).getTime();
  const rows: WeekRow[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday + i * DAY_MS);
    const dateVn = dayKey(day);
    const regular = slots.filter((s) => s.dayOfWeek === day.getUTCDay()).sort((a, b) => a.time.localeCompare(b.time));
    const override = overrideFor(overrides, dateVn);
    const row = (slot: ScheduleSlot, kind: WeekRowKind, original?: ScheduleSlot): WeekRow => ({
      key: `${dateVn}-${slot.id}`,
      dateVn,
      day,
      slot,
      at: instantOn(day, slot.time),
      kind,
      original,
      override,
    });
    if (override?.cancelled) {
      rows.push(...regular.map((s) => row(s, "cancelled")));
      continue;
    }
    const effective = effectiveSlots(slots, day, overrides);
    if (override && isChange(override) && effective.length) {
      rows.push(regular.length ? row(effective[0], "changed", regular[0]) : row(effective[0], "extra"));
      continue;
    }
    rows.push(...regular.map((s) => row(s, "regular")));
  }
  return rows;
}

/**
 * Key of the row to badge as "Kế tiếp": the row of the next stream this week, or,
 * when it falls next week, the regular row of the same weekly slot.
 */
export function nextRowKey(rows: WeekRow[], next: NextStreamSlot | null): string | undefined {
  if (!next) return undefined;
  const dateVn = vnDateKey(next.at);
  const exact = rows.find((r) => r.kind !== "cancelled" && r.dateVn === dateVn && r.slot.id === next.slot.id);
  if (exact) return exact.key;
  if (rows.some((r) => r.dateVn === dateVn)) return undefined;
  return rows.find((r) => r.kind === "regular" && r.slot.id === next.slot.id)?.key;
}
