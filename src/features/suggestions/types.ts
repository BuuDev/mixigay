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
  /** "✓ Chính chủ": the account is verified as anh Độ / the channel team. */
  authorVerified?: boolean;
  createdAt: string;
  upvotes: number;
  status: SuggestionStatus;
  /** Filled from the Steam Store API when source = "steam". */
  steam?: SteamInfo;
  /** Game art served from our own Storage (mirrored Steam header or a fan upload); tried first. */
  thumbnailUrl?: string;
  /** Game slug in "Đã chơi" once status = "played". */
  linkedGameSlug?: string;
}
