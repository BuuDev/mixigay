import type { GlossaryEntry } from "../types";
import { checkSourceUrl } from "./source";

export interface GlossaryRow {
  id: string;
  author_id?: string;
  term: string;
  meaning: string;
  source_url: string;
  approved: boolean;
  created_at: string;
  profiles: { display_name: string | null; verified?: boolean | null } | null;
}

export const GLOSSARY_SELECT = "id,author_id,term,meaning,source_url,approved,created_at,profiles!author_id(display_name,verified)";

/** Null for a row without text or whose source no longer passes the policy: never show a claim without a valid source. */
export function mapGlossaryEntry(r: GlossaryRow): GlossaryEntry | null {
  const term = typeof r.term === "string" ? r.term.trim() : "";
  const meaning = typeof r.meaning === "string" ? r.meaning.trim() : "";
  if (!term || !meaning || typeof r.source_url !== "string") return null;
  const source = checkSourceUrl(r.source_url);
  if (!source.ok) return null;
  return {
    id: r.id,
    term,
    meaning,
    sourceUrl: source.url,
    sourceLabel: source.label,
    author: r.profiles?.display_name?.trim() || "Fan",
    authorId: r.author_id,
    authorVerified: r.profiles?.verified === true,
    createdAt: r.created_at,
    approved: r.approved === true,
  };
}

export function mapGlossaryEntries(rows: GlossaryRow[]): GlossaryEntry[] {
  return rows.map(mapGlossaryEntry).filter((e): e is GlossaryEntry => e !== null);
}
