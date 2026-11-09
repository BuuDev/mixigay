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

/**
 * Official SoundCloud Widget iframe URL for a full `soundcloud.com/<user>/<track>` link.
 * Returns null for non-SoundCloud links or short links (`on.soundcloud.com`) that lack a `<user>/<track>` path.
 */
export function soundcloudEmbedUrl(raw: string, autoPlay = false): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www|m)\./, "");
  if (host !== "soundcloud.com") return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const cleanTrackUrl = `https://soundcloud.com/${segments[0]}/${segments[1]}`;
  const params = new URLSearchParams({
    url: cleanTrackUrl,
    color: "#f97316",
    auto_play: autoPlay ? "true" : "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    show_teaser: "false",
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}
