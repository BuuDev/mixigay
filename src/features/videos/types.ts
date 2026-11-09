export interface Game {
  slug: string;
  name: string;
  /** Lower-case substrings matched against video titles. */
  keywords: string[];
  isVlog?: boolean;
  /** Tailwind gradient classes used as a placeholder cover. */
  cover: string;
}

export interface Video {
  videoId: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  durationMinutes: number;
  wasLive: boolean;
  thumbnailUrl?: string;
  /** Official channel playlists this video belongs to; mapped to games by an admin. */
  playlistIds?: string[];
  /** Set by an admin; overrides keyword classification. */
  manualGameSlug?: string;
}

export type ClassifiedVideo = Video & { gameSlug: string };
