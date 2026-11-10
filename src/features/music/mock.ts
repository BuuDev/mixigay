import type { FanSong } from "./types";

// Mock-mode sample: publicly posted fan "nhạc nịnh" tracks about anh Độ Mixi & Bộ Tộc.
// Only tracks whose URL resolves through SoundCloud oEmbed (i.e. really exist) belong
// here: three earlier entries pointed at pages that do not exist and were removed.
// In Supabase mode every song is approved by an admin before it shows.
export const fanSongs: FanSong[] = [
  {
    id: "song-1",
    title: "Cảm ơn anh Độ Mixi Shibidi – Nhạc nịnh căng nhất 2025",
    artist: "Brother Brủh",
    url: "https://soundcloud.com/brother-br-h/cam-on-anh-do-mixi-shibidi-nhac-ninh-cang-nhat-2025-kill-and-tea-rap-ninh",
    platform: "soundcloud",
    // From SoundCloud oEmbed for this exact URL (fetched 2026-11-10).
    thumbnailUrl: "https://i1.sndcdn.com/artworks-H5qUJ2nglrLSUdV5-2pWQxg-t500x500.jpg",
    upvotes: 0,
    note: "Bản rap nịnh cực cuốn của thành viên Bộ Tộc gửi tặng anh Độ.",
    createdAt: "2026-11-01T00:00:00Z",
  },
];
