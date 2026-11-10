import type { ScheduleOverride, ScheduleSlot } from "../types";

const VN_MS = 7 * 3_600_000;
const DAY_MS = 86_400_000;

/** Title used for an override that adds a stream without a title of its own. */
export const EXTRA_STREAM_TITLE = "Live thêm ngoài lịch";

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" from a UTC-midnight date whose y/m/d are a Vietnam calendar day. */
export function dayKey(day: Date): string {
  return `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
}

/** UTC midnight carrying the Vietnam calendar y/m/d of an instant. */
export function vnDay(at: Date): Date {
  const v = new Date(at.getTime() + VN_MS);
  return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()));
}

/** "YYYY-MM-DD" of the Vietnam calendar day of an instant. */
export function vnDateKey(at: Date): string {
  return dayKey(vnDay(at));
}

export function overrideFor(overrides: readonly ScheduleOverride[] | undefined, key: string): ScheduleOverride | undefined {
  return overrides?.find((o) => o.dateVn === key);
}

/** True when an override moves or adds a stream (as opposed to a note or a cancellation). */
export function isChange(o: ScheduleOverride): boolean {
  return !o.cancelled && Boolean(o.time || o.title);
}

/**
 * Slots that actually happen on a Vietnam calendar day (`day` = UTC midnight of it).
 * Cancelled → none. Time/title → one slot replacing the regular ones (keeps the
 * first regular slot's id, game and note), or an extra stream when the day had
 * none and the override gives a time. A note-only override leaves the day as is.
 */
export function effectiveSlots(slots: readonly ScheduleSlot[], day: Date, overrides?: readonly ScheduleOverride[]): ScheduleSlot[] {
  const regular = slots.filter((s) => s.dayOfWeek === day.getUTCDay());
  const key = dayKey(day);
  const o = overrideFor(overrides, key);
  if (!o) return regular;
  if (o.cancelled) return [];
  if (!isChange(o)) return regular;
  const base = regular[0];
  const time = o.time ?? base?.time;
  if (!time) return []; // a title alone cannot place a stream on a day without one
  return [
    {
      id: base?.id ?? `override-${key}`,
      dayOfWeek: day.getUTCDay(),
      time,
      title: o.title ?? base?.title ?? EXTRA_STREAM_TITLE,
      gameSlug: base?.gameSlug,
      note: o.note ?? base?.note,
    },
  ];
}

/** UTC instant of an "HH:mm" Vietnam time on a Vietnam calendar day. */
export function instantOn(day: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m) - VN_MS);
}

/** Overrides on or after today's Vietnam date, oldest first (`days` limits how far ahead). */
export function upcomingOverrides(overrides: readonly ScheduleOverride[], now: Date, days?: number): ScheduleOverride[] {
  const from = vnDateKey(now);
  const to = days === undefined ? null : vnDateKey(new Date(now.getTime() + days * DAY_MS));
  return overrides.filter((o) => o.dateVn >= from && (to === null || o.dateVn <= to)).sort((a, b) => a.dateVn.localeCompare(b.dateVn));
}
