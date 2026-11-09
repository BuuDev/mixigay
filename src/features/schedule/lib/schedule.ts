import type { ScheduleSlot } from "../types";

const VN_OFFSET_HOURS = 7;

/** Next UTC instant of a weekly Vietnam-time slot, strictly after `from`. */
export function nextOccurrence(slot: ScheduleSlot, from: Date): Date {
  const [h, m] = slot.time.split(":").map(Number);
  const vnNow = new Date(from.getTime() + VN_OFFSET_HOURS * 3_600_000);
  const daysAhead = (slot.dayOfWeek - vnNow.getUTCDay() + 7) % 7;
  const candidate = new Date(
    Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate() + daysAhead, h - VN_OFFSET_HOURS, m),
  );
  if (candidate.getTime() <= from.getTime()) candidate.setUTCDate(candidate.getUTCDate() + 7);
  return candidate;
}

export function nextSlot(slots: ScheduleSlot[], from: Date): { slot: ScheduleSlot; at: Date } | null {
  let best: { slot: ScheduleSlot; at: Date } | null = null;
  for (const slot of slots) {
    const at = nextOccurrence(slot, from);
    if (!best || at < best.at) best = { slot, at };
  }
  return best;
}

export const DAY_NAMES = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

/** Day of week (0 = Sunday) in Vietnam time for an instant. */
export function vnDayOfWeek(at: Date): number {
  return new Date(at.getTime() + VN_OFFSET_HOURS * 3_600_000).getUTCDay();
}

/** True when the regular schedule has no stream on the Vietnam calendar day of `at`. */
export function isOffDay(slots: ScheduleSlot[], at: Date): boolean {
  const day = vnDayOfWeek(at);
  return !slots.some((s) => s.dayOfWeek === day);
}
