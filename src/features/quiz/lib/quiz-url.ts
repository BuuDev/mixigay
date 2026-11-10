import { youtubeUrl } from "@/shared/lib/links";
import type { QuizPlatform } from "../types";

/** Same bounds as the quiz_links CHECKs. */
export const QUIZ_TITLE_MIN = 5;
export const QUIZ_TITLE_MAX = 120;
export const QUIZ_URL_MAX = 300;
export const QUIZ_DESCRIPTION_MAX = 300;

// Mirrors the quiz_links.url CHECK (`~*`, so case-insensitive) exactly: https only, the host
// must be followed by "/" (so look-alikes such as kahoot.it.evil.com or kahoot.it@evil.com fail).
const QUIZ_URL =
  /^https:\/\/((www\.|create\.|play\.)?(kahoot\.it|quizizz\.com|wayground\.com|wordwall\.net|quizlet\.com|blooket\.com)|forms\.gle|docs\.google\.com\/forms)\/[^\s]+$/i;

const BY_HOST: Record<string, QuizPlatform> = {
  "kahoot.it": "kahoot",
  "quizizz.com": "wayground",
  "wayground.com": "wayground",
  "wordwall.net": "wordwall",
  "quizlet.com": "quizlet",
  "blooket.com": "blooket",
};

export const QUIZ_PLATFORM_LABEL: Record<QuizPlatform, string> = {
  kahoot: "Kahoot",
  wayground: "Wayground (Quizizz)",
  wordwall: "Wordwall",
  quizlet: "Quizlet",
  blooket: "Blooket",
  "google-forms": "Google Forms",
};

/** "Kahoot, Wayground (Quizizz), …, Blooket hoặc Google Forms" for hints and error messages. */
export const QUIZ_PLATFORM_LIST = (() => {
  const labels = Object.values(QUIZ_PLATFORM_LABEL);
  return `${labels.slice(0, -1).join(", ")} hoặc ${labels[labels.length - 1]}`;
})();

/** The platform of a quiz link the database would accept, or null (wrong host, http, too long, spaces). */
export function quizPlatform(url: string): QuizPlatform | null {
  if (typeof url !== "string" || [...url].length > QUIZ_URL_MAX) return null;
  const m = QUIZ_URL.exec(url);
  if (!m) return null;
  if (m[3]) return BY_HOST[m[3].toLowerCase()] ?? null;
  return "google-forms";
}

/** The stream moment where anh Độ played the quiz (link out to YouTube, never embedded). */
export function playedMomentUrl(videoId: string, atSeconds?: number): string {
  const base = youtubeUrl(videoId);
  return atSeconds === undefined ? base : `${base}&t=${Math.floor(atSeconds)}s`;
}
