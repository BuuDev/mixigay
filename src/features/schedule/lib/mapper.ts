import type { ScheduleOverride, ScheduleSlot } from "../types";

export interface ScheduleSlotRow {
  id: string;
  day_of_week: number;
  time_vn: string;
  title: string;
  game_slug: string | null;
  note: string | null;
}

export function mapSlot(r: ScheduleSlotRow): ScheduleSlot {
  return {
    id: r.id,
    dayOfWeek: r.day_of_week,
    time: r.time_vn.slice(0, 5), // Postgres returns "HH:mm:ss"
    title: r.title,
    gameSlug: r.game_slug ?? undefined,
    note: r.note ?? undefined,
  };
}

export interface ScheduleOverrideRow {
  date_vn: string;
  cancelled: boolean;
  time_vn: string | null;
  title: string | null;
  note: string | null;
}

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d/;
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** Row → override, or null when the row is unusable (bad date/time), so one bad row cannot break the shared cache. */
export function mapOverride(r: ScheduleOverrideRow): ScheduleOverride | null {
  if (typeof r.date_vn !== "string" || !DATE_RE.test(r.date_vn)) return null;
  if (r.time_vn != null && (typeof r.time_vn !== "string" || !TIME_RE.test(r.time_vn))) return null;
  return {
    dateVn: r.date_vn,
    cancelled: r.cancelled === true,
    time: r.time_vn ? r.time_vn.slice(0, 5) : undefined, // Postgres returns "HH:mm:ss"
    title: text(r.title),
    note: text(r.note),
  };
}

export function mapOverrides(rows: ScheduleOverrideRow[]): ScheduleOverride[] {
  return rows.map(mapOverride).filter((o): o is ScheduleOverride => o !== null);
}
