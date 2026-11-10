import "server-only";

// Thin fetch client for the YouTube Data API v3. Every call reports its quota
// cost through `onUnits` so the caller can record it in api_usage.
// search.list (100 units) is deliberately absent: see docs/08-decisions.md ADR-004.

const BASE = "https://www.googleapis.com/youtube/v3";

export interface YtVideo {
  id: string;
  snippet: {
    title: string;
    /** Part of `snippet`, so reading it costs nothing extra. */
    description?: string;
    publishedAt: string;
    liveBroadcastContent: "live" | "upcoming" | "none";
    thumbnails?: { high?: { url: string }; medium?: { url: string } };
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
  liveStreamingDetails?: {
    scheduledStartTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
    concurrentViewers?: string;
  };
}

interface Page<T> {
  items: T[];
  nextPageToken?: string;
}

export type UnitsReporter = (endpoint: string, units: number) => void | Promise<void>;

export class YouTubeClient {
  constructor(
    private readonly apiKey: string,
    private readonly onUnits: UnitsReporter = () => {},
  ) {}

  private async get<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE}/${endpoint}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("key", this.apiKey);
    await this.onUnits(endpoint, 1);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`YouTube ${endpoint} ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return (await res.json()) as T;
  }

  /** Up to 50 ids per call, 1 unit. */
  async videos(ids: string[]): Promise<YtVideo[]> {
    const out: YtVideo[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const page = await this.get<Page<YtVideo>>("videos", {
        part: "snippet,contentDetails,statistics,liveStreamingDetails",
        id: ids.slice(i, i + 50).join(","),
        maxResults: "50",
      });
      out.push(...page.items);
    }
    return out;
  }

  /** One page of a playlist's video ids, 1 unit. */
  async playlistPage(playlistId: string, pageToken?: string): Promise<{ ids: string[]; nextPageToken?: string }> {
    const page = await this.get<Page<{ contentDetails: { videoId: string } }>>("playlistItems", {
      part: "contentDetails",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    return { ids: page.items.map((i) => i.contentDetails.videoId), nextPageToken: page.nextPageToken };
  }

  /** One page of the channel's public playlists, 1 unit. */
  async channelPlaylists(channelId: string, pageToken?: string) {
    const page = await this.get<Page<{ id: string; snippet: { title: string } }>>("playlists", {
      part: "snippet",
      channelId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    return { playlists: page.items.map((p) => ({ id: p.id, title: p.snippet.title })), nextPageToken: page.nextPageToken };
  }
}

/** 15 most recent uploads from the channel feed. Costs no quota. */
export async function fetchRssVideoIds(channelId: string): Promise<string[]> {
  const { parseRssVideoIds } = await import("./parse");
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { cache: "no-store" });
  if (!res.ok) return [];
  return parseRssVideoIds(await res.text());
}
