import { GAMBLING_BLOCK_PHRASES, GAMBLING_PHRASES, GAMBLING_STEMS, PROFANITY_MARKED, PROFANITY_PLAIN, SHORTENERS } from "./lexicon";
import { collapse, marked, plain, unleet } from "./normalize";

export type Verdict = "ok" | "review" | "block";
export type Flag = "gambling" | "profanity" | "domain" | "shortener";

export interface Screening {
  verdict: Verdict;
  flags: Flag[];
}

const word = (term: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "u");

// "nhacai88 . com", "abc[.]vip", "xyz (dot) net"
const DOMAIN_IN_TEXT = /[a-z0-9-]{3,}\s*(?:\.|\[\.\]|\(dot\)|\(\.\))\s*(?:com|net|org|vn|xyz|club|win|bet|vip|top|site|live|me|io|co|cc|asia|fun|pro|link|online|shop|store|app)\b/;

/**
 * Screens free text a fan submits (titles, reasons, notes). "block" = refuse with a
 * generic message; "review" = allowed but worth a moderator's look; "ok".
 * Never reveal which term matched (no oracle for spammers).
 */
export function screenText(fields: (string | null | undefined)[]): Screening {
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
  if (forms.some((f) => DOMAIN_IN_TEXT.test(f))) flags.add("domain");
  if (SHORTENERS.some((s) => m.includes(s))) {
    flags.add("shortener");
    block = true;
  }
  const verdict: Verdict = block ? "block" : flags.size ? "review" : "ok";
  return { verdict, flags: [...flags] };
}
