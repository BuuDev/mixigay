export type LiveState = "live" | "upcoming" | "offline";

export interface LiveStatus {
  state: LiveState;
  videoId?: string;
  title?: string;
  /** ISO time; for "upcoming" it is the scheduled start, for "live" the actual start. */
  startTime?: string;
  concurrentViewers?: number;
  thumbnailUrl?: string;
  /** ISO time of the last poll against YouTube. */
  checkedAt: string;
}

/** One weekly slot, entered by the admin. Times are Vietnam time (UTC+7, no DST). */
export interface ScheduleSlot {
  id: string;
  /** 0 = Sunday … 6 = Saturday, as Date#getUTCDay. */
  dayOfWeek: number;
  /** "HH:mm" in Asia/Ho_Chi_Minh. */
  time: string;
  title: string;
  gameSlug?: string;
  note?: string;
}

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

export type PlayStatus = "finished" | "playing" | "dropped";

export interface PlayedGame {
  gameSlug: string;
  status: PlayStatus;
  sessions: number;
  lastPlayed: string;
}

export type SuggestionSource = "steam" | "viewer-made" | "other";
export type SuggestionStatus = "pending" | "played" | "rejected";

export interface Suggestion {
  id: string;
  name: string;
  source: SuggestionSource;
  url?: string;
  reason: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  upvotes: number;
  status: SuggestionStatus;
  /** Filled from the Steam Store API when source = "steam". */
  steam?: SteamInfo;
  /** Game slug in "Đã chơi" once status = "played". */
  linkedGameSlug?: string;
}

export interface SteamInfo {
  appId: number;
  price: string;
  genres: string[];
  headerImage?: string;
}

export interface Viewer {
  id: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
}
