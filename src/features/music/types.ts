import type { SongPlatform } from "./lib/song-url";

export interface FanSong {
  id: string;
  title: string;
  artist: string;
  url: string;
  platform: SongPlatform;
  note?: string;
  createdAt: string;
  upvotes: number;
}
