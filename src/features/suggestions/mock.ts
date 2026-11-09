import type { Suggestion } from "./types";

export const suggestions: Suggestion[] = [
  { id: "g1", name: "Lethal Company", source: "steam", url: "https://store.steampowered.com/app/1966720/", reason: "Chơi nhóm 4 người với Refund chắc chắn hài", author: "fan_haiphong", createdAt: "2026-11-02T10:00:00Z", upvotes: 1284, status: "played", steam: { appId: 1966720, price: "142.000₫", genres: ["Kinh dị", "Co-op"] } },
  { id: "g2", name: "R.E.P.O.", source: "steam", url: "https://store.steampowered.com/app/3241660/", reason: "Kiểu Lethal Company nhưng vật lý loạn hơn", author: "tocdo_mixi", createdAt: "2026-11-04T09:00:00Z", upvotes: 963, status: "pending", steam: { appId: 3241660, price: "120.000₫", genres: ["Co-op", "Kinh dị"] } },
  { id: "g3", name: "Bán Trà Sữa Simulator 2", source: "viewer-made", url: "https://itch.io/", reason: "Bản 2 của game viewer làm, có map Hà Nội", author: "dev_banh_mi", createdAt: "2026-11-05T12:00:00Z", upvotes: 721, status: "pending" },
  { id: "g4", name: "Content Warning", source: "steam", url: "https://store.steampowered.com/app/2881650/", reason: "Quay video kinh dị lên mạng, hợp vibe stream", author: "bo_lao", createdAt: "2026-10-29T08:00:00Z", upvotes: 455, status: "pending", steam: { appId: 2881650, price: "Miễn phí", genres: ["Kinh dị", "Co-op"] } },
  { id: "g5", name: "Genshin Impact", source: "other", reason: "Thử thể loại khác xem sao", author: "anonymous_88", createdAt: "2026-10-20T08:00:00Z", upvotes: 37, status: "rejected" },
];
