/** One weekly slot, entered by the admin. Times are Vietnam time (UTC+7, no DST). */
export interface ScheduleSlot {
  id: string;
  /** 0 = Sunday … 6 = Saturday, as Date#getUTCDay. */
  dayOfWeek: number;
  /** "HH:mm" in Asia/Ho_Chi_Minh. */
  time: string;
  title: string;
  gameSlug?: string;
  note?: string;
}
