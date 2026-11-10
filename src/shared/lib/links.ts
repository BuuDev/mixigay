export function youtubeUrl(videoId: string, atSeconds?: number) {
  return `https://www.youtube.com/watch?v=${videoId}${atSeconds ? `&t=${Math.floor(atSeconds)}s` : ""}`;
}

export function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export const OFFICIAL_CHANNEL_URL = "https://www.youtube.com/@MixiGaming3con";

/** Canonical origin for sitemap/robots/metadata. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Official destinations of Kênh MixiGaming (footer "Kênh chính chủ"). Link out only, never embed.
export const OFFICIAL_FANPAGE_URL = "https://www.facebook.com/MixiGaming/";
export const OFFICIAL_GROUP_URL = "https://www.facebook.com/groups/mixigaming/";
export const OFFICIAL_DISCORD_URL = "https://discord.com/invite/mixigaming";
export const OFFICIAL_SHOP_URL = "https://shop.mixigaming.com/";
export const OFFICIAL_DONATE_URL = "https://zypage.com/mixigaming";
export const OFFICIAL_STREAMLABS_URL = "https://streamlabs.com/mixigamingofficial/tip";
