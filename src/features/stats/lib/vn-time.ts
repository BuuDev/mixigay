// Vietnam time (UTC+7, no DST) helpers for stream statistics. Pure arithmetic on
// epoch milliseconds, so results never depend on the server's or browser's TZ.

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const VN_OFFSET_MS = 7 * HOUR_MS;

/**
 * A "stream day" runs 06:00 → 06:00 Vietnam time, so a stream that starts at 00:30
 * belongs to the evening before (it is the same night for the audience). This keeps
 * after-midnight starts from dragging weekday averages towards noon and from
 * breaking a streak of consecutive nights.
 */
export const STREAM_DAY_START_HOUR = 6;

const DAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export interface StreamDay {
  /** "YYYY-MM-DD" of the stream day. */
  key: string;
  /** Integer day index (consecutive stream days differ by 1). */
  index: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /** Minutes after 00:00 of the stream day: 360 (06:00) … 1799 (05:59 next morning). */
  minute: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** The stream day an instant falls on. */
export function streamDayOf(iso: string): StreamDay {
  const shifted = Date.parse(iso) + VN_OFFSET_MS - STREAM_DAY_START_HOUR * HOUR_MS;
  const index = Math.floor(shifted / DAY_MS);
  const d = new Date(index * DAY_MS);
  return {
    key: ymd(d),
    index,
    weekday: d.getUTCDay(),
    minute: Math.floor((shifted - index * DAY_MS) / 60_000) + STREAM_DAY_START_HOUR * 60,
  };
}

/** "20:05" for minutes after midnight (values ≥ 1440 wrap to the next morning). */
export function formatClock(minute: number): string {
  const m = ((Math.round(minute) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** "4 giờ 05 phút", "45 phút". */
export function formatLength(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} phút`;
  return m ? `${h} giờ ${pad(m)} phút` : `${h} giờ`;
}

/** "T7 08/11/2026": Vietnam calendar date of an instant. */
export function formatVnDate(iso: string): string {
  const d = new Date(Date.parse(iso) + VN_OFFSET_MS);
  return `${DAY_SHORT[d.getUTCDay()]} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** "08/11/2026" from a "YYYY-MM-DD" key. */
export function formatDayKey(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

/** "08/11 20:05": Vietnam date and clock time of an instant. */
export function formatVnDateTime(iso: string): string {
  const d = new Date(Date.parse(iso) + VN_OFFSET_MS);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** "1:30": elapsed hours and minutes. */
export function formatElapsed(minute: number): string {
  const total = Math.max(0, Math.round(minute));
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

const counter = new Intl.NumberFormat("vi-VN");

/** "48.213" (Vietnamese digit grouping). */
export function formatCount(n: number): string {
  return counter.format(Math.round(n));
}
