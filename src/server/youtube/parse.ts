/** ISO 8601 duration as YouTube returns it ("PT2H13M5S", "P1DT2H") → seconds. */
export function parseIsoDuration(iso: string | undefined): number {
  const m = iso?.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return 0;
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
  return ((d * 24 + h) * 60 + min) * 60 + s;
}

/** Video IDs from a channel's Atom feed (youtube.com/feeds/videos.xml), newest first. */
export function parseRssVideoIds(xml: string): string[] {
  return [...xml.matchAll(/<yt:videoId>([\w-]{11})<\/yt:videoId>/g)].map((m) => m[1]);
}

/** The channel's uploads playlist: "UC…" → "UU…". */
export function uploadsPlaylistId(channelId: string): string {
  if (!channelId.startsWith("UC")) throw new Error(`Unexpected channel id: ${channelId}`);
  return `UU${channelId.slice(2)}`;
}
