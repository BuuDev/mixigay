const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "vừa xong", "5 phút trước", "3 giờ trước", "2 ngày trước"; older than 30 days → dd/mm/yyyy. */
export function relativeTime(iso: string, now: Date): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, now.getTime() - then);
  if (diff < MINUTE) return "vừa xong";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} phút trước`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} giờ trước`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)} ngày trước`;
  return new Date(then).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
