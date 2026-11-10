import "server-only";
import { parseOembedCover, youtubeCover } from "../lib/song-cover";
import type { SongPlatform } from "../lib/song-url";

const OEMBED: Partial<Record<SongPlatform, (url: string) => string>> = {
  soundcloud: (url) => `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`,
  spotify: (url) => `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
};

/**
 * Cover image for a fan song, from the platform itself: YouTube's thumbnail URL is
 * derived locally; SoundCloud and Spotify via their public oEmbed. TikTok CDN links
 * expire and Zing MP3 / NhacCuaTui have no oEmbed, so those get none.
 * Never throws: a missing cover must not block a submission.
 */
export async function fetchSongCover(url: string, platform: SongPlatform): Promise<string | null> {
  if (platform === "youtube") return youtubeCover(url);
  const endpoint = OEMBED[platform];
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint(url), { signal: AbortSignal.timeout(3000), headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return parseOembedCover(await res.json());
  } catch {
    return null;
  }
}
