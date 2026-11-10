// Song cover images. The browser loads them, so hosts are pinned: mirrors the
// fan_songs.thumbnail_url CHECK in supabase/migrations/20261110160000_quiz_links_song_art.sql.

const COVER_HOST = /^https:\/\/(i[0-9]\.sndcdn\.com|i\.ytimg\.com|i\.scdn\.co|image-cdn-[a-z]{2}\.spotifycdn\.com)\/[^\s]+$/;
const MAX_LENGTH = 500;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** True when the URL is an https image on a pinned cover host (same rule as the DB CHECK). */
export function coverHostAllowed(url: string): boolean {
  return url.length <= MAX_LENGTH && COVER_HOST.test(url);
}

/** Video id of a youtube.com/watch?v=, youtu.be/ or /shorts/ link, else null. */
export function youtubeVideoId(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** YouTube's own thumbnail for a video link (no network), else null. */
export function youtubeCover(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** `thumbnail_url` from an oEmbed JSON response, only when it sits on a pinned host. */
export function parseOembedCover(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const thumb = (json as { thumbnail_url?: unknown }).thumbnail_url;
  if (typeof thumb !== "string") return null;
  return coverHostAllowed(thumb) ? thumb : null;
}
