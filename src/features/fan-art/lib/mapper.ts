import type { FanArtItem } from "../types";
import { driveImageUrl, extractDriveFileId } from "./drive";

export interface FanArtRow {
  id: string;
  title: string;
  artist: string;
  drive_url: string;
  drive_file_id: string;
  note: string | null;
  approved: boolean;
  created_at: string;
}

/** Maps a DB row to FanArtItem, or null if the Drive link/ID is malformed. */
export function mapFanArt(r: FanArtRow): FanArtItem | null {
  const fileId = extractDriveFileId(r.drive_url) ?? (/^[A-Za-z0-9_-]{10,80}$/.test(r.drive_file_id) ? r.drive_file_id : null);
  if (!fileId) return null;
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    driveUrl: r.drive_url,
    driveFileId: fileId,
    imageUrl: driveImageUrl(fileId, 1000),
    note: r.note ?? undefined,
    createdAt: r.created_at,
  };
}

