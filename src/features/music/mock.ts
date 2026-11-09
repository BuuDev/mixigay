import type { FanSong } from "./types";

// Mock-mode sample: a publicly posted fan "nhạc nịnh" track (found 2026-11-09).
// In Supabase mode every song is approved by an admin before it shows.
export const fanSongs: FanSong[] = [
  {
    id: "song-1",
    title: "Cảm ơn anh Độ Mixi Shibidi – Nhạc nịnh căng nhất 2025",
    artist: "Brother Brủh",
    url: "https://soundcloud.com/brother-br-h/cam-on-anh-do-mixi-shibidi-nhac-ninh-cang-nhat-2025-kill-and-tea-rap-ninh",
    platform: "soundcloud",
    note: "Bản rap nịnh của fan (dữ liệu mẫu).",
    createdAt: "2026-11-01T00:00:00Z",
  },
];
