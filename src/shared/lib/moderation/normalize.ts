// Text normalization for spam screening. Not for display.

const INVISIBLE = /[­͏؜ᅟᅠ឴឵᠎​-‏‪-‮⁠-⁤ㅤ︀-️﻿]/g;

// Cyrillic/Greek look-alikes → Latin (the classic "nhасаi" trick).
const HOMOGLYPHS: Record<string, string> = {
  а: "a", в: "b", с: "c", е: "e", һ: "h", і: "i", ј: "j", к: "k", м: "m", н: "h", о: "o", р: "p", ѕ: "s", т: "t", у: "y", х: "x", ԁ: "d", ɡ: "g",
  α: "a", β: "b", ε: "e", ι: "i", κ: "k", ν: "v", ο: "o", ρ: "p", τ: "t", υ: "u", χ: "x",
};

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s" };

/** Lower case, NFKC, invisible characters removed, homoglyphs mapped. Keeps Vietnamese marks. */
export function marked(s: string): string {
  return s
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .toLowerCase()
    .replace(/./gu, (ch) => HOMOGLYPHS[ch] ?? ch)
    .replace(/\s+/g, " ")
    .trim();
}

/** `marked` without diacritics (đ → d): "nổ hũ" → "no hu". */
export function plain(s: string): string {
  return marked(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

/** Digits/symbols that stand for letters, only when touching letters: "c4 d0" → "ca do". Leaves "88" alone. */
export function unleet(s: string): string {
  return s.replace(/(?<=[a-z])[0134578@$]|[0134578@$](?=[a-z])/g, (ch) => LEET[ch] ?? ch);
}

/**
 * Joins letters spread out with separators ("n.h.a c.a.i", "n h a c a i", "t-a-i x-i-u")
 * and squeezes long repeats ("nhaaaacai" → "nhaacai").
 */
export function collapse(s: string): string {
  return s
    .replace(/\b(?:[a-z0-9][\s.\-_*·|/]+){2,}[a-z0-9]\b/g, (run) => run.replace(/[\s.\-_*·|/]+/g, ""))
    .replace(/([a-z])\1{2,}/g, "$1$1");
}

/** Letters and digits only: for display names and URL hosts. */
export function compact(s: string): string {
  return plain(s).replace(/[^a-z0-9]/g, "");
}
