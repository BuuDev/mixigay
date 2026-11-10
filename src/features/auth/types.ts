export interface Viewer {
  id: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
  /** Manages admins and invites (/admin/quan-tri). */
  isOwner: boolean;
  /** "✓ Chính chủ" */
  verified: boolean;
}
