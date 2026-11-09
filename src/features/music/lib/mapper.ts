import type { FanSong } from "../types";
import { songPlatform } from "./song-url";

export interface FanSongRow {
  id: string;
  title: string;
  artist: string;
  url: string;
  note: string | null;
  approved: boolean;
  created_at: string;
  upvotes?: number;
}

/** Null for a row whose link no longer passes the platform check (dropped, not rendered). */
export function mapFanSong(r: FanSongRow): FanSong | null {
  const platform = songPlatform(r.url);
  if (!platform) return null;
  return { id: r.id, title: r.title, artist: r.artist, url: r.url, platform, note: r.note ?? undefined, createdAt: r.created_at, upvotes: r.upvotes ?? 0 };
}
