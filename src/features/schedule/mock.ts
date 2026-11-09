import type { ScheduleOverride, ScheduleSlot } from "./types";

// The official schedule as published in every MixiGaming video description
// (checked 2026-11-09): 22:22–03:00 daily, off Wednesday and Sunday; Saturday
// starts at 23:00. The description publishes times only — no per-day topics,
// so none are invented here.
export const schedule: ScheduleSlot[] = [
  { id: "s1", dayOfWeek: 1, time: "22:22", title: "Live tối Thứ Hai" },
  { id: "s2", dayOfWeek: 2, time: "22:22", title: "Live tối Thứ Ba" },
  { id: "s4", dayOfWeek: 4, time: "22:22", title: "Live tối Thứ Năm" },
  { id: "s5", dayOfWeek: 5, time: "22:22", title: "Live tối Thứ Sáu" },
  { id: "s6", dayOfWeek: 6, time: "23:00", title: "Live tối Thứ Bảy", note: "Thứ Bảy lên sóng lúc 23:00" },
];

// Mock-mode exceptions on fixed dates (illustrative, not real announcements):
// one day off and one moved start time. Fixed dates keep tests deterministic.
export const overrides: ScheduleOverride[] = [
  { dateVn: "2026-11-19", cancelled: true, note: "Ví dụ: nghỉ một hôm" },
  { dateVn: "2026-11-21", cancelled: false, time: "21:00", note: "Ví dụ: lên sóng sớm hơn" },
];
