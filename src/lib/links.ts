export function youtubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export const OFFICIAL_CHANNEL_URL = "https://www.youtube.com/@MixiGaming3con";

/** Canonical origin for sitemap/robots/metadata. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
