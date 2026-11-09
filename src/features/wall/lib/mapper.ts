import type { WallMessage } from "../types";

export interface WallMessageRow {
  id: string;
  author_id?: string;
  body: string;
  approved: boolean;
  created_at: string;
  profiles: { display_name: string | null; verified?: boolean | null } | null;
}

export const WALL_SELECT = "id,author_id,body,approved,created_at,profiles(display_name,verified)";

/** Null for a row with no visible text (dropped, not rendered as an empty card). */
export function mapWallMessage(r: WallMessageRow): WallMessage | null {
  const body = typeof r.body === "string" ? r.body.trim() : "";
  if (!body) return null;
  return {
    id: r.id,
    body,
    author: r.profiles?.display_name?.trim() || "Fan",
    authorId: r.author_id,
    authorVerified: r.profiles?.verified === true,
    createdAt: r.created_at,
    approved: r.approved === true,
  };
}

export function mapWallMessages(rows: WallMessageRow[]): WallMessage[] {
  return rows.map(mapWallMessage).filter((m): m is WallMessage => m !== null);
}
