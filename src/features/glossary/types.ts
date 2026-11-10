/** A glossary entry a fan contributed ("Fan góp"), shown after the curated deck once approved. */
export interface GlossaryEntry {
  id: string;
  term: string;
  meaning: string;
  /** https link that passed the source policy (lib/source.ts). */
  sourceUrl: string;
  /** Short name of the source site ("YouTube", "Kenh14"…). */
  sourceLabel: string;
  author: string;
  /** For moderation tools; absent in demo data. */
  authorId?: string;
  authorVerified: boolean;
  createdAt: string;
  approved: boolean;
}
