import { GAMBLING_BLOCK_PHRASES, GAMBLING_PHRASES, GAMBLING_STEMS, PROFANITY_MARKED, PROFANITY_PLAIN, SHORTENERS } from "./lexicon";
import { collapse, marked, plain, unleet } from "./normalize";

export type Verdict = "ok" | "review" | "block";
export type Flag = "gambling" | "profanity" | "domain" | "shortener" | "spam";

/** A term an admin added at /admin/tu-khoa (public.blocked_terms). Every category blocks. */
export interface ExtraTerm {
  term: string;
  category: "gambling" | "profanity" | "spam";
}

export interface Screening {
  verdict: Verdict;
  flags: Flag[];
}

const word = (term: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "u");

// "nhacai88 . com", "abc[.]vip", "xyz (dot) net"
const DOMAIN_IN_TEXT =
  /[a-z0-9-]{3,}\s*(?:\.|\[\.\]|\(dot\)|\(\.\))\s*(?:com|net|org|vn|xyz|club|win|bet|vip|top|site|live|me|io|co|cc|asia|fun|pro|link|online|shop|store|app)\b/;

/**
 * Does an admin-added term occur in the text? Normalised like the built-in lexicon:
 * - a term without diacritics matches the plain, de-leeted and collapsed forms ("cado" ← "c.a.d.o");
 * - a term with diacritics also matches its plain form for gambling/spam (spammers drop the
 *   marks), but profanity only matches marked, like PROFANITY_MARKED ("đĩ" must not hit "đi").
 */
function matchesExtra({ term, category }: ExtraTerm, m: string, forms: string[]): boolean {
  const tm = marked(term);
  const tp = plain(term);
  if (tp.replace(/[^a-z0-9]/g, "").length < 2) return false;
  const wordsOf = (t: string) => (t.includes(" ") ? [word(t), word(t.replace(/ /g, ""))] : [word(t)]);
  if (tm !== tp) {
    if (wordsOf(tm).some((re) => re.test(m) || re.test(unleetMarked(m)))) return true;
    if (category === "profanity") return false;
  }
  return wordsOf(tp).some((re) => forms.some((f) => re.test(f)));
}

/** `unleet` for text that keeps Vietnamese marks ("đ1t" → "đit"). */
const unleetMarked = (s: string) => s.replace(/(?<=\p{L})[0134578@$]|[0134578@$](?=\p{L})/gu, (ch) => unleet(`a${ch}`).slice(1));

/**
 * Screens free text a fan submits (titles, reasons, notes). "block" = refuse with a
 * generic message; "review" = allowed but worth a moderator's look; "ok".
 * `extra`: admin-managed terms (getBlockedTerms()); a match blocks.
 * Never reveal which term matched (no oracle for spammers).
 */
export function screenText(fields: (string | null | undefined)[], extra: readonly ExtraTerm[] = []): Screening {
  const raw = fields.filter(Boolean).join(" \n ");
  const m = marked(raw);
  const p = plain(raw);
  const forms = [p, unleet(p), collapse(unleet(p))];
  const tokens = new Set(forms.flatMap((f) => f.split(/[^a-z0-9]+/).filter(Boolean)));
  const flags = new Set<Flag>();
  let block = false;

  if ([...tokens].some((t) => GAMBLING_STEMS.some((s) => t.startsWith(s))) || GAMBLING_BLOCK_PHRASES.some((ph) => forms.some((f) => word(ph).test(f)))) {
    flags.add("gambling");
    block = true;
  }
  if (GAMBLING_PHRASES.some((ph) => forms.some((f) => word(ph).test(f)))) flags.add("gambling");
  if (PROFANITY_PLAIN.some((w) => forms.some((f) => word(w).test(f))) || PROFANITY_MARKED.some((w) => word(w).test(m))) {
    flags.add("profanity");
    block = true;
  }
  for (const t of extra) {
    if (!matchesExtra(t, m, forms)) continue;
    flags.add(t.category);
    block = true;
  }
  if (forms.some((f) => DOMAIN_IN_TEXT.test(f))) flags.add("domain");
  if (SHORTENERS.some((s) => m.includes(s))) {
    flags.add("shortener");
    block = true;
  }
  const verdict: Verdict = block ? "block" : flags.size ? "review" : "ok";
  return { verdict, flags: [...flags] };
}
