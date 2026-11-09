import type { NextStreamSlot, ScheduleOverride, ScheduleSlot } from "../types";
import { effectiveSlots, instantOn, overrideFor, dayKey, vnDay } from "./overrides";

const VN_OFFSET_HOURS = 7;

/** Next UTC instant of a weekly Vietnam-time slot, strictly after `from`. */
export function nextOccurrence(slot: ScheduleSlot, from: Date): Date {
  const [h, m] = slot.time.split(":").map(Number);
  const vnNow = new Date(from.getTime() + VN_OFFSET_HOURS * 3_600_000);
  const daysAhead = (slot.dayOfWeek - vnNow.getUTCDay() + 7) % 7;
  const candidate = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate() + daysAhead, h - VN_OFFSET_HOURS, m));
  if (candidate.getTime() <= from.getTime()) candidate.setUTCDate(candidate.getUTCDate() + 7);
  return candidate;
}

/**
 * Soonest stream strictly after `from`. With `overrides`, cancelled days are
 * skipped and moved/extra streams count (see `effectiveSlots`).
 */
export function nextSlot(slots: ScheduleSlot[], from: Date, overrides?: readonly ScheduleOverride[]): NextStreamSlot | null {
  if (!overrides?.length) {
    let best: NextStreamSlot | null = null;
    for (const slot of slots) {
      const at = nextOccurrence(slot, from);
      if (!best || at < best.at) best = { slot, at };
    }
    return best;
  }
  return scan(slots, from, overrides, 1);
}

/** Latest stream start at or before `from` (slots + overrides), or null. */
export function prevSlot(slots: ScheduleSlot[], from: Date, overrides?: readonly ScheduleOverride[]): NextStreamSlot | null {
  return scan(slots, from, overrides ?? [], -1);
}

// Walks Vietnam calendar days from `from`'s day. Each cancellation can push the
// next stream back by at most a week, so 7 × (overrides ahead + 1) days always suffice.
function scan(slots: ScheduleSlot[], from: Date, overrides: readonly ScheduleOverride[], dir: 1 | -1): NextStreamSlot | null {
  const start = vnDay(from).getTime();
  const startKey = dayKey(new Date(start));
  const ahead = overrides.filter((o) => (dir === 1 ? o.dateVn >= startKey : o.dateVn <= startKey)).length;
  const limit = 7 * (ahead + 1) + 1;
  for (let d = 0; d <= limit; d++) {
    const day = new Date(start + dir * d * 86_400_000);
    const hits = effectiveSlots(slots, day, overrides)
      .map((slot) => ({ slot, at: instantOn(day, slot.time) }))
      .filter(({ at }) => (dir === 1 ? at.getTime() > from.getTime() : at.getTime() <= from.getTime()))
      .sort((a, b) => dir * (a.at.getTime() - b.at.getTime()));
    if (hits.length) {
      const override = overrideFor(overrides, dayKey(day));
      return override ? { ...hits[0], override } : hits[0];
    }
  }
  return null;
}

export const DAY_NAMES = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

/** Day of week (0 = Sunday) in Vietnam time for an instant. */
export function vnDayOfWeek(at: Date): number {
  return new Date(at.getTime() + VN_OFFSET_HOURS * 3_600_000).getUTCDay();
}

/** True when no stream happens on the Vietnam calendar day of `at` (regular schedule, then `overrides`). */
export function isOffDay(slots: ScheduleSlot[], at: Date, overrides?: readonly ScheduleOverride[]): boolean {
  return effectiveSlots(slots, vnDay(at), overrides).length === 0;
}
