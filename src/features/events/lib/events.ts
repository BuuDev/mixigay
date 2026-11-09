// "Radar sự kiện Bộ Tộc": yearly fixed dates (counted down) and open plans
// whose date nobody knows yet (shown as a status, never as an invented date).

export interface AnnualEvent {
  id: string;
  label: string;
  /** 1–12, Vietnam calendar. */
  month: number;
  day: number;
  note: string;
  source: { label: string; href: string };
}

export interface OpenEvent {
  id: string;
  label: string;
  status: string;
  source: { label: string; href: string };
}

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export const ANNUAL_EVENTS: AnnualEvent[] = [
  {
    id: "gop-gach",
    label: "Tháng Góp Gạch Xây Trường",
    month: 12,
    day: 1,
    note: "Tháng 12 hằng năm là mùa thiện nguyện của Bộ Tộc.",
    source: { label: "Tiền Phong", href: "https://hoahoctro.tienphong.vn/doan-truong-dh-kinh-te-quoc-dan-du-an-gop-gach-xay-truong-khanh-thanh-3-truong-tieu-hoc-post1493317.tpo" },
  },
  {
    id: "sinh-nhat",
    label: "Sinh nhật Tộc Trưởng",
    month: 9,
    day: 12,
    note: "12/09 — năm nào cũng có quà muộn và quiz khoảnh khắc sinh nhật trên sóng.",
    source: { label: "Wikipedia", href: "https://vi.wikipedia.org/wiki/%C4%90%E1%BB%99_Mixi" },
  },
];

export const OPEN_EVENTS: OpenEvent[] = [
  { id: "an-lieng-5", label: "Phòng Trà An Liễng #5", status: "Chưa có lịch — #4 lên sóng khoảng 26/10/2026.", source: { label: "An Liễng #4", href: yt("m4Navy7s4l0") } },
  { id: "onlan-df", label: "Giải onlan Delta Force", status: "Mới nhắc kế hoạch trên sóng (khoảng cuối 10/2026).", source: { label: "Stream kế hoạch", href: yt("sIuJDWV0yjg") } },
  { id: "stream-escape-4", label: "Mixi Stream Escape 4", status: "Chờ dev Bộ Tộc tung phần tiếp theo sau phần 3 (03/11).", source: { label: "Phần 3", href: yt("JklCD7GmnBk") } },
  { id: "yep", label: "YEP cuối năm & tiết mục múa cổ trang", status: "Chưa có ngày — kế hoạch học múa được kể ngày 30/10.", source: { label: "Stream 30/10", href: yt("84MUSnIXi94") } },
];

const VN_MS = 7 * 3_600_000;
const DAY_MS = 86_400_000;

/** Vietnam calendar date of an instant as a UTC-midnight Date. */
function vnDay(now: Date): Date {
  const v = new Date(now.getTime() + VN_MS);
  return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()));
}

/** Days until the next (month, day) in the Vietnam calendar; 0 means today. */
export function daysUntilAnnual(month: number, day: number, now: Date): { days: number; date: Date } {
  const today = vnDay(now);
  let target = new Date(Date.UTC(today.getUTCFullYear(), month - 1, day));
  if (target < today) target = new Date(Date.UTC(today.getUTCFullYear() + 1, month - 1, day));
  return { days: Math.round((target.getTime() - today.getTime()) / DAY_MS), date: target };
}

/** True while the Vietnam date is inside December (the charity month). */
export function isCharityMonth(now: Date): boolean {
  return vnDay(now).getUTCMonth() === 11;
}
