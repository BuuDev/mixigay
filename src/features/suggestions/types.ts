export type SuggestionSource = "steam" | "viewer-made" | "other";
export type SuggestionStatus = "pending" | "played" | "rejected";

export interface SteamInfo {
  appId: number;
  price: string;
  genres: string[];
  headerImage?: string;
}

export interface Suggestion {
  id: string;
  name: string;
  source: SuggestionSource;
  url?: string;
  reason: string;
  author: string;
  authorAvatar?: string;
  /** For reporting an offensive display name; absent in demo data. */
  authorId?: string;
  createdAt: string;
  upvotes: number;
  status: SuggestionStatus;
  /** Filled from the Steam Store API when source = "steam". */
  steam?: SteamInfo;
  /** Game slug in "Đã chơi" once status = "played". */
  linkedGameSlug?: string;
}
