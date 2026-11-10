import { screenText } from "@/shared/lib/moderation/screen";

// Rules for game art stored in our own Supabase Storage bucket `game-art`
// (supabase/migrations/20261110190000_game_art.sql). Pure: used by the server
// sanitiser, the mapper and the upload form.

export const ART_BUCKET = "game-art";
/** Largest upload a fan may send (the action body limit in next.config.ts leaves room for multipart overhead). */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
/** Larger sides are refused before decoding (decompression bombs, absurd scans). */
export const MAX_INPUT_SIDE = 8000;
export const ART_WIDTH = 640;
export const ART_HEIGHT = 360;
export const ART_QUALITY = 80;
/** Shown to fans; the server decides by magic bytes, never by this list or the declared type. */
export const ACCEPT_ATTR = "image/jpeg,image/png,image/webp";

export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

/** Image type from the first bytes of the file. The declared MIME type and file name are ignored. */
export function sniffImageType(bytes: Uint8Array): ImageMime | undefined {
  const at = (i: number, ...sig: number[]) => sig.every((b, k) => bytes[i + k] === b);
  if (bytes.length >= 3 && at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (bytes.length >= 8 && at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  // "RIFF" <size> "WEBP"
  if (bytes.length >= 12 && at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  return undefined;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Same pattern as the CHECK on suggestions.thumbnail_path. */
const ART_PATH = /^suggestions\/[0-9a-f-]{36}\.webp$/;

export function isArtPath(path: string | null | undefined): path is string {
  return typeof path === "string" && ART_PATH.test(path);
}

/** Object path for a new image; the server picks the uuid, never the client. */
export function storagePath(uuid: string): string {
  const id = uuid.toLowerCase();
  if (!UUID.test(id)) throw new Error("storagePath: not a uuid");
  return `suggestions/${id}.webp`;
}

/** Public URL of an object in the game-art bucket, or undefined when the base or path is not usable. */
export function publicArtUrl(supabaseUrl: string, path: string | null | undefined): string | undefined {
  if (!supabaseUrl || !isArtPath(path)) return undefined;
  let base: URL;
  try {
    base = new URL(supabaseUrl);
  } catch {
    return undefined;
  }
  if (base.protocol !== "https:" && base.protocol !== "http:") return undefined;
  return `${base.origin}/storage/v1/object/public/${ART_BUCKET}/${path}`;
}

/** Steam CDN hosts we mirror from; same list as images.remotePatterns in next.config.ts. */
export const STEAM_ART_HOSTS = ["shared.akamai.steamstatic.com", "cdn.akamai.steamstatic.com", "shared.fastly.steamstatic.com"] as const;

export function isSteamArtUrl(raw: string | undefined): raw is string {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && (STEAM_ART_HOSTS as readonly string[]).includes(url.hostname);
  } catch {
    return false;
  }
}

// ----- Automated check (Google Cloud Vision SafeSearch + OCR) -----

export type Likelihood = "UNKNOWN" | "VERY_UNLIKELY" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";
export interface SafeSearchAnnotation {
  adult?: Likelihood;
  spoof?: Likelihood;
  medical?: Likelihood;
  violence?: Likelihood;
  racy?: Likelihood;
}
export type ImageVerdict = "block" | "review" | "ok";
export interface ImageJudgement {
  verdict: ImageVerdict;
  /** For admins only; fans always get a generic message. */
  reasons: string[];
}

const CATEGORIES = [
  ["adult", "18+"],
  ["violence", "bạo lực"],
  ["racy", "khiêu gợi"],
] as const;

/**
 * Maps SafeSearch likelihoods and the text found in the image to a verdict:
 * LIKELY / VERY_LIKELY → block, POSSIBLE → review; OCR text goes through screenText
 * (block → block, flagged → review). A missing annotation is never "ok".
 */
export function judgeSafeSearch(annotation: SafeSearchAnnotation | null | undefined, ocrText?: string | null): ImageJudgement {
  if (!annotation) return { verdict: "review", reasons: ["không có kết quả quét ảnh"] };
  const reasons: string[] = [];
  let verdict: ImageVerdict = "ok";
  const raise = (v: ImageVerdict) => {
    if (v === "block" || (v === "review" && verdict === "ok")) verdict = v;
  };
  for (const [key, label] of CATEGORIES) {
    const level = annotation[key];
    if (level === "LIKELY" || level === "VERY_LIKELY") {
      raise("block");
      reasons.push(`${label}: ${level}`);
    } else if (level === "POSSIBLE") {
      raise("review");
      reasons.push(`${label}: ${level}`);
    }
  }
  const text = ocrText?.trim();
  if (text) {
    const screening = screenText([text]);
    if (screening.verdict !== "ok") {
      raise(screening.verdict);
      reasons.push(`chữ trong ảnh: ${screening.flags.join(", ")}`);
    }
  }
  return { verdict, reasons };
}

/** What the server stores in suggestion_art_reviews.review (admin-only table; admin view + banning). */
export interface ThumbnailReview extends ImageJudgement {
  source: "upload" | "steam";
  /** SHA-256 of the stored WebP (what "chặn vĩnh viễn" bans). */
  sha256: string;
  /** SHA-256 of the bytes as uploaded/downloaded. */
  originalSha256: string;
}

const SHA = /^[0-9a-f]{64}$/;

/** The review is jsonb: accept only the expected shape. */
export function parseThumbnailReview(raw: unknown): ThumbnailReview | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (r.verdict !== "block" && r.verdict !== "review" && r.verdict !== "ok") return undefined;
  if (r.source !== "upload" && r.source !== "steam") return undefined;
  if (typeof r.sha256 !== "string" || !SHA.test(r.sha256) || typeof r.originalSha256 !== "string" || !SHA.test(r.originalSha256)) return undefined;
  const reasons = Array.isArray(r.reasons) ? r.reasons.filter((x): x is string => typeof x === "string") : [];
  return { verdict: r.verdict, source: r.source, sha256: r.sha256, originalSha256: r.originalSha256, reasons };
}
