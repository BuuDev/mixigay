// Google Drive personal share-link helpers for Fan Art (0 MB server storage).
// Mirrors the CHECK constraint in supabase/migrations/20261110100000_fan_art_and_quiz.sql.

const FILE_ID_RE = /^[A-Za-z0-9_-]{10,80}$/;

/**
 * Extracts a Google Drive file ID from common personal share URL formats:
 * - https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing
 * - https://drive.google.com/open?id=<FILE_ID>
 * - https://drive.google.com/uc?id=<FILE_ID>&export=view
 * - https://drive.google.com/thumbnail?id=<FILE_ID>&sz=w1000
 */
export function extractDriveFileId(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (host !== "drive.google.com" && host !== "docs.google.com") return null;

  const pathMatch = url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]{10,80})(?:\/|$)/);
  if (pathMatch && FILE_ID_RE.test(pathMatch[1])) {
    return pathMatch[1];
  }

  const queryId = url.searchParams.get("id");
  if (queryId && FILE_ID_RE.test(queryId)) {
    return queryId;
  }

  return null;
}

/** Canonical share URL stored in Postgres (`drive_url` column). */
export function canonicalDriveUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Direct embeddable preview URL for a public Google Drive image ("Anyone with the link can view").
 * Uses Google Drive's official thumbnail endpoint which serves inline images without cookie prompts.
 */
export function driveImageUrl(fileId: string, width = 1000): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${width}`;
}

