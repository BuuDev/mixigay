export interface WallMessage {
  id: string;
  body: string;
  author: string;
  /** For moderation tools; absent in demo data. */
  authorId?: string;
  /** "✓ Chính chủ": the account is verified as anh Độ / the channel team. */
  authorVerified: boolean;
  createdAt: string;
  approved: boolean;
}
