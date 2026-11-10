import type { Quote } from "../types";

export interface QuoteRow {
  id: string;
  author_id?: string;
  video_id: string;
  at_seconds: number;
  body: string;
  approved: boolean;
  created_at: string;
  profiles: { display_name: string | null; verified?: boolean | null } | null;
  videos: { title: string | null } | null;
}

// `!author_id` / `!video_id`: name the FK so PostgREST never sees two paths (docs/07-conventions.md).
export const QUOTE_SELECT = "id,author_id,video_id,at_seconds,body,approved,created_at,profiles!author_id(display_name,verified),videos!video_id(title)";

/** Null for a row that cannot be shown (no text, bad timestamp). */
export function mapQuote(r: QuoteRow): Quote | null {
  const body = typeof r.body === "string" ? r.body.trim() : "";
  const at = Number(r.at_seconds);
  if (!body || typeof r.video_id !== "string" || !r.video_id || !Number.isInteger(at) || at < 0) return null;
  return {
    id: r.id,
    body,
    videoId: r.video_id,
    videoTitle: r.videos?.title?.trim() || null,
    atSeconds: at,
    author: r.profiles?.display_name?.trim() || "Fan",
    authorId: r.author_id,
    authorVerified: r.profiles?.verified === true,
    createdAt: r.created_at,
    approved: r.approved === true,
  };
}

export function mapQuotes(rows: QuoteRow[]): Quote[] {
  return rows.map(mapQuote).filter((q): q is Quote => q !== null);
}
