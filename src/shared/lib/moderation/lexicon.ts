// Vietnamese spam/abuse lexicon. Kept small and specific on purpose: every term
// here was chosen so that, after normalization, it does not collide with normal
// Vietnamese words (see screen.test.ts for the "must stay ok" sentences).
// NAME_BLOCK_STEMS is mirrored in supabase/migrations/20261110090000_moderation.sql
// (seed of public.banned_terms) — lexicon.test.ts keeps the two in sync.

/** Gambling brands/stems — matched as a token prefix on the collapsed text. Always "block". */
export const GAMBLING_STEMS = [
  "nhacai",
  "nohu",
  "taixiu",
  "keobong",
  "casino",
  "w88",
  "fb88",
  "188bet",
  "kubet",
  "sunwin",
  "go88",
  "rikvip",
  "hitclub",
  "789club",
  "iwin",
  "jun88",
  "new88",
  "shbet",
  "mu88",
  "f8bet",
  "8xbet",
] as const;

/** Spaced forms of the stems ("nhà cái", "nổ hũ"…) on the plain text, word boundaries. "block". */
export const GAMBLING_BLOCK_PHRASES = ["nha cai", "no hu", "tai xiu", "keo bong", "ban ca doi thuong", "game bai doi thuong"] as const;

/** Gambling phrases on the plain (no-diacritics) text, word boundaries. "review". */
export const GAMBLING_PHRASES = ["ca do", "ca cuoc", "lo de", "nap tien", "hoan tra", "dang ky nhan", "link vao", "code tan thu", "rut tien"] as const;

/** Strong profanity, unambiguous after removing diacritics. "block". */
export const PROFANITY_PLAIN = ["dmm", "dcm", "dkm", "dcmm", "vcl", "vkl", "vl", "dit me", "dit con", "djt", "du ma", "duma", "dm may", "oc cho", "cho chet", "cut di", "con cho"] as const;

/** Profanity only recognisable WITH diacritics or teencode (the plain form is a normal word). "block". */
export const PROFANITY_MARKED = ["lồn", "l0n", "loz", "cặc", "c4c", "cak", "buồi", "bu0i", "đụ", "cứt", "đéo", "đếch", "thằng độ", "con đĩ", "đĩ"] as const;

/** URL shorteners — hide the real destination. */
export const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "s.id", "is.gd", "rb.gy", "shorturl.at", "tiny.cc", "ow.ly", "goo.gl", "v.gd"] as const;

/**
 * What a display name may never contain (compact form: letters/digits only).
 * Mirrored as the seed of public.banned_terms — the DB rewrites such names to "Fan ####".
 */
export const NAME_BLOCK_STEMS = [...GAMBLING_STEMS, "dmm", "dcm", "dkm", "vcl", "ditme", "duma", "occho"] as const;
