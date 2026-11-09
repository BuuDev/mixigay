import type { FanSong } from "./types";

// Mock-mode sample: publicly posted fan "nhạc nịnh" tracks about anh Độ Mixi & Bộ Tộc.
// In Supabase mode every song is approved by an admin before it shows.
export const fanSongs: FanSong[] = [
  {
    id: "song-1",
    title: "Cảm ơn anh Độ Mixi Shibidi – Nhạc nịnh căng nhất 2025",
    artist: "Brother Brủh",
    url: "https://soundcloud.com/brother-br-h/cam-on-anh-do-mixi-shibidi-nhac-ninh-cang-nhat-2025-kill-and-tea-rap-ninh",
    platform: "soundcloud",
    upvotes: 0,
    note: "Bản rap nịnh cực cuốn của thành viên Bộ Tộc gửi tặng anh Độ.",
    createdAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "song-2",
    title: "Cảm ơn anh Độ Mixi (Fan Rap Tribute)",
    artist: "SnowRin",
    url: "https://soundcloud.com/snowrin/c-m-n-anh-mixi",
    platform: "soundcloud",
    upvotes: 0,
    note: "Giai điệu nhẹ nhàng nghe lúc đợi giờ lên sóng 22:22.",
    createdAt: "2026-10-28T00:00:00Z",
  },
  {
    id: "song-3",
    title: "Độ Tộc 2 – Masew x Phúc Du x Pháo x anh Độ Mixi",
    artist: "Masew · Phúc Du · Pháo · Bộ Tộc",
    url: "https://soundcloud.com/masew/do-toc-2",
    platform: "soundcloud",
    upvotes: 0,
    note: "Bài ca truyền thống mỗi dịp họp mặt Bộ Tộc và sinh nhật Tộc Trưởng.",
    createdAt: "2026-10-20T00:00:00Z",
  },
  {
    id: "song-4",
    title: "Stream Đến Bao Giờ – HuyR ft. anh Độ Mixi (Lo-Fi Chill)",
    artist: "HuyR · Fan Remix",
    url: "https://soundcloud.com/huyr-music/stream-den-bao-gio",
    platform: "soundcloud",
    upvotes: 0,
    note: "Nhạc nền quen thuộc mỗi tối anh em ngồi canh phòng chờ.",
    createdAt: "2026-10-15T00:00:00Z",
  },
];
