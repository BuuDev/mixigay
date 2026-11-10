import type { Chapter } from "../types";

// Chapters ("0:00 Mở đầu", "1:02:03 – Boss", "(12:30) …") come from the video
// description the sync job already fetches (videos.list part=snippet, no extra
// quota). A list only counts when it follows YouTube's own rule: the first
// timestamp is 0:00, there are at least 3 entries, they are ascending and each
// chapter lasts at least 10 seconds.

export const MIN_CHAPTERS = 3;
export const MIN_CHAPTER_SECONDS = 10;
const MAX_CHAPTERS = 100;
const MAX_TITLE = 100;

// h:mm:ss or m:ss / mm:ss, optionally wrapped in () or [].
const TIME = String.raw`[(\[]?((?:\d{1,2}:)?\d{1,3}:\d{2})(?!\d)[)\]]?`;
// Bullets and separators that commonly sit around a timestamp.
const LEAD = String.raw`^[\s•·▶►▸*\-–—]*`;
const SEP = String.raw`[\s\-–—:|·•.)\]]*`;
const LEADING = new RegExp(`${LEAD}${TIME}${SEP}(.*)$`, "u");
const TRAILING = new RegExp(String.raw`^(.*?)[\s\-–—:|·•(\[]+${TIME}\s*$`, "u");

/** "1:02:03" → 3723; "12:30" → 750; null when a field is out of range. */
export function parseTimestamp(raw: string): number | null {
  const parts = raw.split(":").map(Number);
  if (parts.some((n) => !Number.isInteger(n) || n < 0)) return null;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return m < 60 && s < 60 ? h * 3600 + m * 60 + s : null;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return s < 60 ? m * 60 + s : null;
  }
  return null;
}

/** 3723 → "1:02:03", 750 → "12:30", 5 → "0:05". */
export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^[\s\-–—:|·•.]+/u, "")
    .replace(/[\s\-–—:|·•]+$/u, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE);
}

/** One description line as a chapter, or null when it carries no timestamp + title. */
export function parseChapterLine(line: string): Chapter | null {
  const lead = line.match(LEADING);
  const trail = lead ? null : line.match(TRAILING);
  const time = lead?.[1] ?? trail?.[2];
  const rawTitle = lead?.[2] ?? trail?.[1];
  if (!time || rawTitle === undefined) return null;
  const t = parseTimestamp(time);
  const title = cleanTitle(rawTitle);
  if (t === null || !title) return null;
  return { t, title };
}

/**
 * Chapters in a YouTube description, or null when there is no valid list.
 * Starts at the first 0:00 line and follows timestamp lines while they keep
 * ascending; other lines in between (links, blank lines) are skipped.
 */
export function parseChapters(description: string | null | undefined): Chapter[] | null {
  if (!description) return null;
  const lines = description.split(/\r?\n/).map(parseChapterLine);
  const start = lines.findIndex((c) => c?.t === 0);
  if (start < 0) return null;
  const out: Chapter[] = [];
  for (const c of lines.slice(start)) {
    if (!c) continue;
    const prev = out.at(-1);
    if (prev && c.t <= prev.t) break;
    out.push(c);
    if (out.length === MAX_CHAPTERS) break;
  }
  return isValidChapterList(out) ? out : null;
}

/** YouTube's rule: starts at 0:00, ≥ 3 entries, ascending, each ≥ 10 s long. */
export function isValidChapterList(chapters: Chapter[]): boolean {
  if (chapters.length < MIN_CHAPTERS || chapters[0].t !== 0) return false;
  return chapters.every((c, i) => i === 0 || c.t - chapters[i - 1].t >= MIN_CHAPTER_SECONDS);
}

/** Validates the `videos.chapters` jsonb value read back from the DB. */
export function toChapters(json: unknown): Chapter[] | undefined {
  if (!Array.isArray(json)) return undefined;
  const list = json.filter(
    (c): c is Chapter => typeof c === "object" && c !== null && Number.isInteger((c as Chapter).t) && typeof (c as Chapter).title === "string",
  );
  return list.length === json.length && isValidChapterList(list) ? list.map((c) => ({ t: c.t, title: c.title })) : undefined;
}

/** The newest past stream that has chapters (for the /video timeline). */
export function latestStreamWithChapters<V extends { wasLive: boolean; publishedAt: string; chapters?: Chapter[] }>(videos: V[]): V | undefined {
  return videos
    .filter((v) => v.wasLive && (v.chapters?.length ?? 0) >= MIN_CHAPTERS)
    .reduce<V | undefined>((best, v) => (!best || Date.parse(v.publishedAt) > Date.parse(best.publishedAt) ? v : best), undefined);
}
