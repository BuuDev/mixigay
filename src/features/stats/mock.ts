// Demo data for mock mode (no Supabase). Fully deterministic: fixed dates and a
// seeded generator, never the current time, so prerenders stay stable.
import type { LiveSample, StreamMeta } from "./types";

interface MockNight {
  /** Vietnam date and start time. */
  date: string;
  start: string;
  minutes: number;
  /** Rough audience size in thousands. */
  crowd: number;
  title: string;
}

const NIGHTS: MockNight[] = [
  { date: "2026-10-17", start: "20:10", minutes: 255, crowd: 38, title: "Live tối thứ 7 – Delta Force cùng anh em Refund (dữ liệu mẫu)" },
  { date: "2026-10-19", start: "20:35", minutes: 210, crowd: 31, title: "Thử game mới viewer đề xuất (dữ liệu mẫu)" },
  { date: "2026-10-20", start: "20:20", minutes: 240, crowd: 33, title: "Tộc Trưởng leo rank tối thứ 3 (dữ liệu mẫu)" },
  { date: "2026-10-21", start: "21:05", minutes: 195, crowd: 29, title: "Tối thứ 4 chơi game kinh dị (dữ liệu mẫu)" },
  { date: "2026-10-22", start: "20:15", minutes: 280, crowd: 35, title: "Đấu giải giao hữu cùng anh em (dữ liệu mẫu)" },
  { date: "2026-10-24", start: "20:00", minutes: 320, crowd: 52, title: "Đêm GTA V roleplay – Refund Gaming (dữ liệu mẫu)" },
  { date: "2026-10-26", start: "20:30", minutes: 200, crowd: 30, title: "Tối thứ 2 nói chuyện với Bộ Tộc (dữ liệu mẫu)" },
  { date: "2026-10-28", start: "23:40", minutes: 150, crowd: 27, title: "Live khuya bất ngờ (dữ liệu mẫu)" },
  { date: "2026-10-30", start: "20:05", minutes: 265, crowd: 41, title: "Tối thứ 6 – game sinh tồn cùng anh em (dữ liệu mẫu)" },
  { date: "2026-10-31", start: "19:50", minutes: 345, crowd: 61, title: "Đêm Halloween – game kinh dị cả tối (dữ liệu mẫu)" },
  { date: "2026-11-01", start: "20:25", minutes: 230, crowd: 36, title: "Chủ nhật thư giãn (dữ liệu mẫu)" },
  { date: "2026-11-02", start: "20:40", minutes: 205, crowd: 32, title: "Tối thứ 2 thử game indie (dữ liệu mẫu)" },
  { date: "2026-11-04", start: "20:15", minutes: 250, crowd: 34, title: "Leo rank tối thứ 4 (dữ liệu mẫu)" },
  { date: "2026-11-06", start: "20:10", minutes: 270, crowd: 44, title: "Tối thứ 6 – Delta Force (dữ liệu mẫu)" },
  { date: "2026-11-07", start: "20:00", minutes: 300, crowd: 49, title: "Live tối thứ 7 – GTA V cùng Refund Gaming (dữ liệu mẫu)" },
  { date: "2026-11-08", start: "20:30", minutes: 225, crowd: 37, title: "Chủ nhật cuối tuần cùng Bộ Tộc (dữ liệu mẫu)" },
];

export const MOCK_WINDOW_DAYS = 90;

/** Mulberry32: a tiny seeded PRNG. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function startMs(n: MockNight): number {
  const [h, m] = n.start.split(":").map(Number);
  return Date.parse(`${n.date}T00:00:00Z`) + ((h - 7) * 60 + m) * 60_000;
}

function build() {
  const samples: LiveSample[] = [];
  const metas: StreamMeta[] = [];
  NIGHTS.forEach((n, k) => {
    const videoId = `demoStream${String(k + 1).padStart(2, "0")}`;
    const start = startMs(n);
    const rand = rng(k * 7919 + 17);
    const crest = 0.45 + rand() * 0.35; // where the crowd is largest, as a share of the stream
    let drift = 0;
    for (let i = 1; i <= n.minutes; i++) {
      const x = i / n.minutes;
      const ramp = Math.min(1, i / 25);
      const tail = x > 0.92 ? 1 - (x - 0.92) * 4 : 1;
      const hump = 1 - Math.abs(x - crest) * 0.55;
      drift = drift * 0.9 + (rand() - 0.5) * 0.06;
      const viewers = Math.round(n.crowd * 1000 * ramp * tail * hump * (1 + drift));
      samples.push({ videoId, sampledAt: new Date(start + i * 60_000).toISOString(), viewers: Math.max(1, viewers) });
    }
    metas.push({
      videoId,
      title: n.title,
      actualStartAt: new Date(start).toISOString(),
      actualEndAt: new Date(start + (n.minutes + 1) * 60_000).toISOString(),
    });
  });
  return { samples, metas };
}

export const { samples, metas } = build();
