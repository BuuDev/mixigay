import type { ScheduleSlot } from "../types";

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
