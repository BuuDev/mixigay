// Sample data for the UI prototype. Every getter in data.ts reads from here
// until it is switched to Supabase; video IDs are fake.
import type {
  Game,
  LiveStatus,
  PlayedGame,
  ScheduleSlot,
  Suggestion,
  Video,
} from "./types";

export const games: Game[] = [
  { slug: "pubg", name: "PUBG", keywords: ["pubg", "battlegrounds"], cover: "from-amber-500 to-orange-700" },
  { slug: "gta-v", name: "GTA V Roleplay", keywords: ["gta", "rp", "mixi city"], cover: "from-emerald-500 to-teal-800" },
  { slug: "cs2", name: "Counter-Strike 2", keywords: ["cs2", "csgo", "counter-strike"], cover: "from-sky-500 to-indigo-800" },
  { slug: "lol", name: "Liên Minh Huyền Thoại", keywords: ["lmht", "liên minh", "league of legends"], cover: "from-yellow-400 to-blue-800" },
  { slug: "horror", name: "Game kinh dị", keywords: ["kinh dị", "horror", "phasmophobia"], cover: "from-zinc-600 to-red-900" },
  { slug: "viewer-made", name: "Game viewer làm", keywords: ["game viewer", "game fan làm"], cover: "from-fuchsia-500 to-purple-800" },
  { slug: "vlog", name: "Vlog", keywords: ["vlog", "du lịch", "ăn", "review", "đi chơi"], isVlog: true, cover: "from-rose-400 to-pink-700" },
];

export const liveStatus: LiveStatus = {
  state: "live",
  videoId: "demoLive001",
  title: "PUBG cùng anh em Refund – leo rank đầu mùa",
  startTime: "2026-11-09T01:05:00Z",
  concurrentViewers: 48213,
  checkedAt: "2026-11-09T14:58:00Z",
};

export const schedule: ScheduleSlot[] = [
  { id: "s1", dayOfWeek: 1, time: "20:00", title: "PUBG leo rank", gameSlug: "pubg" },
  { id: "s2", dayOfWeek: 2, time: "20:00", title: "Mixi City RP", gameSlug: "gta-v" },
  { id: "s3", dayOfWeek: 3, time: "20:00", title: "CS2 cùng Refund", gameSlug: "cs2" },
  { id: "s4", dayOfWeek: 4, time: "21:00", title: "Đêm kinh dị", gameSlug: "horror", note: "Có thể lùi 30 phút" },
  { id: "s5", dayOfWeek: 5, time: "20:00", title: "Thử game viewer làm", gameSlug: "viewer-made" },
  { id: "s6", dayOfWeek: 6, time: "14:00", title: "Stream ban ngày – game tự chọn" },
  { id: "s7", dayOfWeek: 0, time: "20:00", title: "Mixi City RP", gameSlug: "gta-v" },
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

export const playedGames: PlayedGame[] = [
  { gameSlug: "pubg", status: "playing", sessions: 412, lastPlayed: "2026-11-08" },
  { gameSlug: "gta-v", status: "playing", sessions: 268, lastPlayed: "2026-11-07" },
  { gameSlug: "cs2", status: "playing", sessions: 97, lastPlayed: "2026-11-06" },
  { gameSlug: "horror", status: "finished", sessions: 35, lastPlayed: "2026-11-05" },
  { gameSlug: "lol", status: "dropped", sessions: 6, lastPlayed: "2026-10-30" },
  { gameSlug: "viewer-made", status: "finished", sessions: 12, lastPlayed: "2026-11-01" },
];

export const suggestions: Suggestion[] = [
  { id: "g1", name: "Lethal Company", source: "steam", url: "https://store.steampowered.com/app/1966720/", reason: "Chơi nhóm 4 người với Refund chắc chắn hài", author: "fan_haiphong", createdAt: "2026-11-02T10:00:00Z", upvotes: 1284, status: "played", steam: { appId: 1966720, price: "142.000₫", genres: ["Kinh dị", "Co-op"] } },
  { id: "g2", name: "R.E.P.O.", source: "steam", url: "https://store.steampowered.com/app/3241660/", reason: "Kiểu Lethal Company nhưng vật lý loạn hơn", author: "tocdo_mixi", createdAt: "2026-11-04T09:00:00Z", upvotes: 963, status: "pending", steam: { appId: 3241660, price: "120.000₫", genres: ["Co-op", "Kinh dị"] } },
  { id: "g3", name: "Bán Trà Sữa Simulator 2", source: "viewer-made", url: "https://itch.io/", reason: "Bản 2 của game viewer làm, có map Hà Nội", author: "dev_banh_mi", createdAt: "2026-11-05T12:00:00Z", upvotes: 721, status: "pending" },
  { id: "g4", name: "Content Warning", source: "steam", url: "https://store.steampowered.com/app/2881650/", reason: "Quay video kinh dị lên mạng, hợp vibe stream", author: "bo_lao", createdAt: "2026-10-29T08:00:00Z", upvotes: 455, status: "pending", steam: { appId: 2881650, price: "Miễn phí", genres: ["Kinh dị", "Co-op"] } },
  { id: "g5", name: "Genshin Impact", source: "other", reason: "Thử thể loại khác xem sao", author: "anonymous_88", createdAt: "2026-10-20T08:00:00Z", upvotes: 37, status: "rejected" },
];
