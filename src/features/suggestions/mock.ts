import type { Suggestion } from "./types";

// Demo mode only (no Supabase configured). Facts about real people are never invented here:
// game names are real store titles, reasons describe the game (not what anh Độ or anyone
// said or did), vote counts are small sample numbers, and only GTA V — which the channel
// really streams ("(GTA V 2026) …" videos) — is marked as played. The two fan-made entries
// are clearly sample games, so the "Bộ Tộc tự làm" tab and the "Đang hot" ranking have
// something to show.
export const suggestions: Suggestion[] = [
  {
    id: "g1",
    name: "Game mẫu: Thoát khỏi phòng chờ 22:22",
    source: "viewer-made",
    url: "https://itch.io/",
    reason: "Game giải đố mẫu do Bộ Tộc tự làm, chơi chừng một tiếng, hợp xem cùng anh em.",
    author: "Fan mẫu 1",
    createdAt: "2026-11-09T12:00:00Z",
    upvotes: 9,
    status: "pending",
  },
  {
    id: "g2",
    name: "Liar's Bar",
    source: "steam",
    url: "https://store.steampowered.com/app/3097560/",
    reason: "Game lừa bài 4 người, chơi cùng anh em chắc chắn có biến.",
    author: "Fan mẫu 2",
    createdAt: "2026-11-04T10:00:00Z",
    upvotes: 48,
    status: "pending",
    steam: { appId: 3097560, price: "Chưa rõ giá", genres: ["Nhiều người chơi"] },
  },
  {
    id: "g3",
    name: "R.E.P.O.",
    source: "steam",
    url: "https://store.steampowered.com/app/3241660/",
    reason: "Co-op khiêng đồ trong nhà ma, hợp đội 4 người vừa sợ vừa cười.",
    author: "Fan mẫu 3",
    createdAt: "2026-11-03T09:00:00Z",
    upvotes: 41,
    status: "pending",
    steam: { appId: 3241660, price: "Chưa rõ giá", genres: ["Co-op", "Kinh dị"] },
  },
  {
    id: "g4",
    name: "Game mẫu: Tiệm tạp hóa Bộ Tộc",
    source: "viewer-made",
    url: "https://itch.io/",
    reason: "Game giả lập kinh doanh mẫu do fan làm, mở tiệm, nhập hàng, chiều khách.",
    author: "Fan mẫu 4",
    createdAt: "2026-11-01T08:00:00Z",
    upvotes: 17,
    status: "pending",
  },
  {
    id: "g5",
    name: "Grand Theft Auto V",
    source: "steam",
    url: "https://store.steampowered.com/app/271590/",
    reason: "Thế giới mở nhập vai cùng anh em, mỗi buổi một câu chuyện.",
    author: "Fan mẫu 5",
    createdAt: "2026-10-20T08:00:00Z",
    upvotes: 63,
    status: "played",
    linkedGameSlug: "gta-v",
    steam: { appId: 271590, price: "Chưa rõ giá", genres: ["Hành động", "Thế giới mở"] },
  },
  {
    id: "g6",
    name: "Genshin Impact",
    source: "other",
    reason: "Đổi gió sang game nhập vai thế giới mở.",
    author: "Fan mẫu 6",
    createdAt: "2026-10-18T08:00:00Z",
    upvotes: 3,
    status: "rejected",
  },
];
