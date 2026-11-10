import type { SongPlatform } from "./lib/song-url";

export interface FanSong {
  id: string;
  title: string;
  artist: string;
  url: string;
  platform: SongPlatform;
  note?: string;
  /** Cover from the platform (host-pinned), absent for TikTok / Zing MP3 / NhacCuaTui. */
  thumbnailUrl?: string;
  createdAt: string;
  upvotes: number;
}
