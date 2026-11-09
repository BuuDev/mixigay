// "Hồ sơ Dự Án Ma": plans announced on stream (wording from the channel's own
// restream titles). No invented progress — the only number shown is how long
// ago it was announced; `doneVideoId` marks one as done with its video.
// (Owner's decision 2026-11-09: real day counter, not made-up % or statuses.)

export interface GhostProject {
  id: string;
  title: string;
  /** The restream title's own words. */
  quote: string;
  /** When it was said on stream (restream publish date, Vietnam date). */
  announcedAt: string;
  /** True when the date is only known to the week/month ("2 tuần trước"). */
  approx: boolean;
  videoId: string;
  /** Set when a later video shows it actually happened. */
  doneVideoId?: string;
}

export const GHOST_PROJECTS: GhostProject[] = [
  { id: "thuong-hai", title: "Gặp gỡ fan tại Thượng Hải", quote: "cùng nhau lên kế hoạch gặp gỡ fan tại Thượng Hải", announcedAt: "2026-11-08", approx: false, videoId: "IR0qmMXbgc0" },
  { id: "ve-du-an-ma", title: "Miệt mài vẽ dự án ma", quote: "Độ Mixi miệt mài vẽ dự án ma", announcedAt: "2026-11-06", approx: false, videoId: "PoFdB4XcLe8" },
  { id: "mua-co-trang", title: "Học múa cổ trang cho tiết mục YEP", quote: "kế hoạch học múa cổ trang cho tiết mục YEP cuối năm", announcedAt: "2026-10-30", approx: false, videoId: "84MUSnIXi94" },
  { id: "atvncg-3", title: "Tìm nhân tố cho ATVNCG mùa 3", quote: "tìm ra nhân tố siêu phù hợp cho ATVNCG mùa 3", announcedAt: "2026-10-27", approx: false, videoId: "hoEy8LW6r7I" },
  { id: "onlan-df", title: "Giải onlan Delta Force", quote: "Kế hoạch giải onlan Delta Force siêu hoành tráng", announcedAt: "2026-10-26", approx: true, videoId: "sIuJDWV0yjg" },
  { id: "doi-tac-uc", title: "Kèo nhậu với “đối tác bên Úc”", quote: "chốt kèo nhậu với “đối tác bên Úc”", announcedAt: "2026-10-19", approx: true, videoId: "NFuUdM1PWFE" },
  { id: "hoc-nhay", title: "Dự án học nhảy cải thiện sức khỏe", quote: "nghiêm túc với dự án học nhảy cải thiện sức khỏe", announcedAt: "2026-10-10", approx: true, videoId: "d5ycvxdHmjw" },
];

const DAY_MS = 86_400_000;
const VN_MS = 7 * 3_600_000;

/** Whole Vietnam calendar days from `isoDate` (YYYY-MM-DD, Vietnam date) to `now`. */
export function daysSince(isoDate: string, now: Date): number {
  const start = Date.parse(`${isoDate}T00:00:00Z`) - VN_MS;
  return Math.max(0, Math.floor((now.getTime() - start) / DAY_MS));
}
