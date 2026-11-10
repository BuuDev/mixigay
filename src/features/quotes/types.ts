export interface Quote {
  id: string;
  body: string;
  videoId: string;
  /** Title of the source video; null when the video row is missing from the embed. */
  videoTitle: string | null;
  /** Second of the video where the line is said. */
  atSeconds: number;
  author: string;
  /** For moderation tools; absent in demo data. */
  authorId?: string;
  /** "✓ Chính chủ": the account is verified as anh Độ / the channel team. */
  authorVerified: boolean;
  createdAt: string;
  approved: boolean;
}

/** A video fans can pick in the form (recent uploads of the channel). */
export interface QuoteVideoOption {
  videoId: string;
  title: string;
  /** Upper bound for the timestamp, when known. */
  durationSeconds?: number;
}
