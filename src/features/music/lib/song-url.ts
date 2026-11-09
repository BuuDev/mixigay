// Fan songs are links to the platform where the fan published them. Mirrors the
// host check in supabase/migrations/20261109120000_fan_songs.sql.

export type SongPlatform = "youtube" | "soundcloud" | "tiktok" | "spotify" | "zingmp3" | "nhaccuatui";

const HOSTS: Record<string, SongPlatform> = {
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "soundcloud.com": "soundcloud",
  "on.soundcloud.com": "soundcloud",
  "tiktok.com": "tiktok",
  "vt.tiktok.com": "tiktok",
  "open.spotify.com": "spotify",
  "zingmp3.vn": "zingmp3",
  "nhaccuatui.com": "nhaccuatui",
};

export const PLATFORM_LABEL: Record<SongPlatform, string> = {
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  tiktok: "TikTok",
  spotify: "Spotify",
  zingmp3: "Zing MP3",
  nhaccuatui: "NhacCuaTui",
};

/** Platform of an https link to a known music/video site, else null. */
export function songPlatform(raw: string): SongPlatform | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.pathname.length < 2) return null;
  const host = url.hostname.replace(/^(www|m)\./, "");
  return HOSTS[host] ?? null;
}
