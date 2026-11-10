import { z } from "zod";

export const TERM_CATEGORIES = ["gambling", "profanity", "spam"] as const;
export type TermCategory = (typeof TERM_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<TermCategory, string> = { gambling: "Cờ bạc", profanity: "Tục tĩu", spam: "Quảng cáo / spam" };

export const isTermCategory = (c: string): c is TermCategory => (TERM_CATEGORIES as readonly string[]).includes(c);

/** How a term is stored: NFC, lower case, trimmed, single spaces (blocked_terms checks lower case, 2..60). */
export function normalizeTerm(raw: string): string {
  return raw.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

export const TermInput = z.object({
  term: z.string().transform(normalizeTerm).pipe(z.string().min(2, "Từ khóa ít nhất 2 ký tự.").max(60, "Từ khóa tối đa 60 ký tự.")),
  category: z.enum(TERM_CATEGORIES),
});
