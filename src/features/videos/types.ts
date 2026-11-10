export interface Game {
  slug: string;
  name: string;
  /** Lower-case substrings matched against video titles. */
  keywords: string[];
  isVlog?: boolean;
  /** Tailwind gradient classes used as a placeholder cover. */
  cover: string;
}

/** One chapter of a video: start offset in seconds and its title (from the description). */
export interface Chapter {
  t: number;
  title: string;
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
  /** Chapters parsed from the YouTube description (valid lists only). */
  chapters?: Chapter[];
  /** A YouTube Short (≤ 3 minutes, not a stream); kept out of the regular grids. */
  isShort?: boolean;
}

export type ClassifiedVideo = Video & { gameSlug: string };
