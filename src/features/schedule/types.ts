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

/**
 * One-day exception to the weekly schedule, keyed by Vietnam calendar date.
 * `cancelled` drops every slot that day; otherwise `time`/`title` replace that
 * day's slot (or add a stream on a day without one, when `time` is set).
 */
export interface ScheduleOverride {
  /** "YYYY-MM-DD", Vietnam calendar day. */
  dateVn: string;
  cancelled: boolean;
  /** "HH:mm" in Asia/Ho_Chi_Minh. */
  time?: string;
  title?: string;
  note?: string;
}

/** The next stream as computed from slots + overrides. */
export interface NextStreamSlot {
  slot: ScheduleSlot;
  /** UTC instant it starts. */
  at: Date;
  /** Set when that day's slot comes from (or is changed by) an override. */
  override?: ScheduleOverride;
}
