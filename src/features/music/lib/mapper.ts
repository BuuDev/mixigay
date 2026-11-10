import type { FanSong } from "../types";
import { coverHostAllowed } from "./song-cover";
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
  thumbnail_url?: string | null;
}

/** Null for a row whose link no longer passes the platform check (dropped, not rendered). */
export function mapFanSong(r: FanSongRow): FanSong | null {
  const platform = songPlatform(r.url);
  if (!platform) return null;
  // Re-checked on read: the image is loaded by every visitor's browser.
  const thumbnailUrl = r.thumbnail_url && coverHostAllowed(r.thumbnail_url) ? r.thumbnail_url : undefined;
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    url: r.url,
    platform,
    note: r.note ?? undefined,
    thumbnailUrl,
    createdAt: r.created_at,
    upvotes: r.upvotes ?? 0,
  };
}
