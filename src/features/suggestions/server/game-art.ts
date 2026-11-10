import "server-only";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ART_BUCKET,
  ART_HEIGHT,
  ART_QUALITY,
  ART_WIDTH,
  isArtPath,
  isSteamArtUrl,
  judgeSafeSearch,
  MAX_INPUT_SIDE,
  MAX_UPLOAD_BYTES,
  sniffImageType,
  storagePath,
  type ImageJudgement,
  type SafeSearchAnnotation,
  type ThumbnailReview,
} from "../lib/image-policy";

// Game art in our own Storage (bucket game-art). Every function here takes the
// service-role client: images are sanitised server-side and users never write Storage
// directly (docs/07-conventions.md, "Service role", exception 3).

const TIMEOUT_MS = 5000;
const sha256 = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

export type Sanitized = { ok: true; webp: Buffer; sha256: string; originalSha256: string } | { ok: false; reason: string };

/**
 * Decodes and re-encodes an image: only single-frame JPEG/PNG/WebP up to 8000 px a
 * side; EXIF orientation applied, then a 640×360 cover crop as WebP. Re-encoding
 * drops every metadata block (EXIF, GPS, XMP, ICC comments).
 */
export async function sanitizeImage(input: Uint8Array): Promise<Sanitized> {
  if (input.byteLength === 0 || input.byteLength > MAX_UPLOAD_BYTES) return { ok: false, reason: "size" };
  const mime = sniffImageType(input);
  if (!mime) return { ok: false, reason: "type" };
  const options = { limitInputPixels: MAX_INPUT_SIDE * MAX_INPUT_SIDE, failOn: "error" as const };
  try {
    const meta = await sharp(input, options).metadata();
    if (`image/${meta.format}` !== mime) return { ok: false, reason: "type" };
    if ((meta.pages ?? 1) > 1) return { ok: false, reason: "animated" };
    if (!meta.width || !meta.height || meta.width > MAX_INPUT_SIDE || meta.height > MAX_INPUT_SIDE) return { ok: false, reason: "dimensions" };
    const webp = await sharp(input, options)
      .rotate()
      .resize(ART_WIDTH, ART_HEIGHT, { fit: "cover", position: "attention" })
      .webp({ quality: ART_QUALITY })
      .toBuffer();
    return { ok: true, webp, sha256: sha256(webp), originalSha256: sha256(input) };
  } catch {
    return { ok: false, reason: "decode" };
  }
}

/** True when either hash was banned by an admin ("Gỡ ảnh + chặn vĩnh viễn"). Errors count as banned (fail closed). */
export async function isBannedImage(db: SupabaseClient, hashes: string[]): Promise<boolean> {
  const { data, error } = await db.from("banned_image_hashes").select("sha256").in("sha256", hashes).limit(1);
  if (error) {
    console.error("isBannedImage", error);
    return true;
  }
  return (data ?? []).length > 0;
}

interface VisionResponse {
  responses?: {
    safeSearchAnnotation?: SafeSearchAnnotation;
    textAnnotations?: { description?: string }[];
    fullTextAnnotation?: { text?: string };
    error?: { message?: string };
  }[];
}

/**
 * Google Cloud Vision SafeSearch + OCR when GOOGLE_VISION_API_KEY is set. Without the
 * key, or on any error, the image goes to manual review: never "ok" by default. The
 * suggestion is pre-moderated either way.
 */
export async function checkImage(image: Uint8Array): Promise<ImageJudgement> {
  const key = process.env.GOOGLE_VISION_API_KEY;
  if (!key) return { verdict: "review", reasons: ["chưa bật quét tự động"] };
  try {
    const res = await fetch("https://vision.googleapis.com/v1/images:annotate", {
      method: "POST",
      // Header rather than ?key= so the key never ends up in a URL log.
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        requests: [
          {
            image: { content: Buffer.from(image).toString("base64") },
            features: [{ type: "SAFE_SEARCH_DETECTION" }, { type: "TEXT_DETECTION", maxResults: 1 }],
          },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return { verdict: "review", reasons: [`quét tự động lỗi (HTTP ${res.status})`] };
    const first = ((await res.json()) as VisionResponse).responses?.[0];
    if (!first || first.error) return { verdict: "review", reasons: ["quét tự động lỗi"] };
    const text = first.fullTextAnnotation?.text ?? first.textAnnotations?.[0]?.description ?? "";
    return judgeSafeSearch(first.safeSearchAnnotation, text);
  } catch {
    return { verdict: "review", reasons: ["quét tự động không phản hồi"] };
  }
}

/** Uploads a sanitised WebP to game-art/suggestions/<uuid>.webp; returns the path or null. */
export async function storeArt(db: SupabaseClient, webp: Buffer): Promise<string | null> {
  const path = storagePath(randomUUID());
  const { error } = await db.storage.from(ART_BUCKET).upload(path, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("storeArt", error);
    return null;
  }
  return path;
}

export async function deleteArt(db: SupabaseClient, path: string | null | undefined): Promise<void> {
  if (!isArtPath(path)) return;
  const { error } = await db.storage.from(ART_BUCKET).remove([path]);
  if (error) console.error("deleteArt", error);
}

/**
 * Stores an image for a suggestion and records the review; replaces (and deletes) any
 * previous image. Returns the stored path, or null when nothing was saved.
 */
export async function attachArt(
  db: SupabaseClient,
  suggestionId: string,
  art: Extract<Sanitized, { ok: true }>,
  judgement: ImageJudgement,
  source: ThumbnailReview["source"],
): Promise<string | null> {
  const path = await storeArt(db, art.webp);
  if (!path) return null;
  const { data: before } = await db.from("suggestions").select("thumbnail_path").eq("id", suggestionId).maybeSingle();
  const review: ThumbnailReview = { ...judgement, source, sha256: art.sha256, originalSha256: art.originalSha256 };
  const { data, error } = await db.from("suggestions").update({ thumbnail_path: path }).eq("id", suggestionId).select("id");
  if (error || !data?.length) {
    if (error) console.error("attachArt", error);
    await deleteArt(db, path);
    return null;
  }
  // Admin-only table (see migration 20261110190000): verdict + hashes for review and banning.
  const saved = await db.from("suggestion_art_reviews").upsert({ suggestion_id: suggestionId, review, updated_at: new Date().toISOString() });
  if (saved.error) console.error("attachArt review", saved.error);
  if (before?.thumbnail_path && before.thumbnail_path !== path) await deleteArt(db, before.thumbnail_path as string);
  return path;
}

/**
 * Downloads a Steam suggestion's header image once and serves it from our Storage, so
 * fans whose ISP blocks Steam still see it. Never throws: failures (Steam unreachable,
 * e.g. a VN DNS block on a dev machine) come back as { skipped }.
 */
export async function mirrorSteamArt(db: SupabaseClient, suggestionId: string): Promise<{ path: string } | { skipped: string }> {
  try {
    const { data: row, error } = await db.from("suggestions").select("steam_data").eq("id", suggestionId).maybeSingle();
    if (error || !row) return { skipped: "không tìm thấy đề xuất" };
    const header = (row.steam_data as { headerImage?: unknown } | null)?.headerImage;
    if (typeof header !== "string" || !isSteamArtUrl(header)) return { skipped: "không có ảnh Steam hợp lệ" };
    const res = await fetch(header, { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "error", cache: "no-store" });
    if (!res.ok) return { skipped: `Steam trả về HTTP ${res.status}` };
    if (Number(res.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES) return { skipped: "ảnh Steam quá lớn" };
    const art = await sanitizeImage(new Uint8Array(await res.arrayBuffer()));
    if (!art.ok) return { skipped: `ảnh Steam không đọc được (${art.reason})` };
    if (await isBannedImage(db, [art.sha256, art.originalSha256])) return { skipped: "ảnh đã bị chặn" };
    // Steam's own store art: no Vision call (saves the free quota).
    const path = await attachArt(db, suggestionId, art, { verdict: "ok", reasons: ["ảnh Steam"] }, "steam");
    return path ? { path } : { skipped: "không lưu được vào Storage" };
  } catch (e) {
    return { skipped: e instanceof Error ? `không tải được ảnh Steam (${e.name})` : "không tải được ảnh Steam" };
  }
}
