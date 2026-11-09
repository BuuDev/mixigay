import type { ScheduleSlot } from "./types";

export const schedule: ScheduleSlot[] = [
  { id: "s1", dayOfWeek: 1, time: "20:00", title: "PUBG leo rank", gameSlug: "pubg" },
  { id: "s2", dayOfWeek: 2, time: "20:00", title: "Mixi City RP", gameSlug: "gta-v" },
  { id: "s3", dayOfWeek: 3, time: "20:00", title: "CS2 cùng Refund", gameSlug: "cs2" },
  { id: "s4", dayOfWeek: 4, time: "21:00", title: "Đêm kinh dị", gameSlug: "horror", note: "Có thể lùi 30 phút" },
  { id: "s5", dayOfWeek: 5, time: "20:00", title: "Thử game viewer làm", gameSlug: "viewer-made" },
  { id: "s6", dayOfWeek: 6, time: "14:00", title: "Stream ban ngày – game tự chọn" },
  { id: "s7", dayOfWeek: 0, time: "20:00", title: "Mixi City RP", gameSlug: "gta-v" },
];
