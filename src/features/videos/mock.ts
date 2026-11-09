import type { Game, Video } from "./types";

export const games: Game[] = [
  { slug: "pubg", name: "PUBG", keywords: ["pubg", "battlegrounds"], cover: "from-amber-500 to-orange-700" },
  { slug: "gta-v", name: "GTA V Roleplay", keywords: ["gta", "rp", "mixi city"], cover: "from-emerald-500 to-teal-800" },
  { slug: "cs2", name: "Counter-Strike 2", keywords: ["cs2", "csgo", "counter-strike"], cover: "from-sky-500 to-indigo-800" },
  { slug: "lol", name: "Liên Minh Huyền Thoại", keywords: ["lmht", "liên minh", "league of legends"], cover: "from-yellow-400 to-blue-800" },
  { slug: "horror", name: "Game kinh dị", keywords: ["kinh dị", "horror", "phasmophobia"], cover: "from-zinc-600 to-red-900" },
  { slug: "viewer-made", name: "Game viewer làm", keywords: ["game viewer", "game fan làm"], cover: "from-fuchsia-500 to-purple-800" },
  { slug: "vlog", name: "Vlog", keywords: ["vlog", "du lịch", "ăn", "review", "đi chơi"], isVlog: true, cover: "from-rose-400 to-pink-700" },
];

export const videos: Video[] = [
  { videoId: "demoVid0001", title: "PUBG – Top 1 với 18 kill, anh em Refund gánh còng lưng", publishedAt: "2026-11-08T16:00:00Z", viewCount: 1_240_000, durationMinutes: 312, wasLive: true },
  { videoId: "demoVid0002", title: "Mixi City RP #142 – Ông chủ quán net bị truy nã", publishedAt: "2026-11-07T16:00:00Z", viewCount: 2_310_000, durationMinutes: 280, wasLive: true },
  { videoId: "demoVid0003", title: "CS2 – Pha clutch 1v4 không thể tin nổi", publishedAt: "2026-11-06T16:00:00Z", viewCount: 870_000, durationMinutes: 245, wasLive: true },
  { videoId: "demoVid0004", title: "Phasmophobia – Đêm kinh dị hét khản cổ", publishedAt: "2026-11-05T17:00:00Z", viewCount: 1_560_000, durationMinutes: 198, wasLive: true },
  { videoId: "demoVid0005", title: "Vlog Đà Lạt – đi ăn lẩu gà lá é cùng team", publishedAt: "2026-11-03T05:00:00Z", viewCount: 3_120_000, durationMinutes: 24, wasLive: false },
  { videoId: "demoVid0006", title: "Thử game viewer làm: Độ đi giao trà sữa", publishedAt: "2026-11-01T16:00:00Z", viewCount: 990_000, durationMinutes: 176, wasLive: true },
  { videoId: "demoVid0007", title: "LMHT – Trở lại Summoner's Rift sau 3 năm", publishedAt: "2026-10-30T16:00:00Z", viewCount: 1_870_000, durationMinutes: 220, wasLive: true },
  { videoId: "demoVid0008", title: "Review bàn phím cơ anh em tặng", publishedAt: "2026-10-28T05:00:00Z", viewCount: 640_000, durationMinutes: 18, wasLive: false },
  { videoId: "demoVid0009", title: "Stream tâm sự cuối tuần – trả lời câu hỏi anh em", publishedAt: "2026-10-26T13:00:00Z", viewCount: 520_000, durationMinutes: 150, wasLive: true },
  { videoId: "demoVid0010", title: "Mixi City RP #141 – Phi vụ ngân hàng thế kỷ", publishedAt: "2026-10-25T16:00:00Z", viewCount: 2_050_000, durationMinutes: 295, wasLive: true },
  { videoId: "demoVid0011", title: "PUBG – Bo cuối nghẹt thở map Erangel", publishedAt: "2026-10-23T16:00:00Z", viewCount: 1_010_000, durationMinutes: 300, wasLive: true },
  { videoId: "demoVid0012", title: "Một ngày ở Hà Giang không có wifi", publishedAt: "2026-10-20T05:00:00Z", viewCount: 2_740_000, durationMinutes: 31, wasLive: false, manualGameSlug: "vlog" },
];
