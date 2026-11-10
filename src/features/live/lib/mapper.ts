import { thumbnailFor } from "@/shared/lib/links";
import type { LiveStatus } from "../types";

export interface LiveStatusRow {
  state: "live" | "upcoming" | "offline";
  video_id: string | null;
  title: string | null;
  start_time: string | null;
  concurrent_viewers: number | null;
  checked_at: string | null;
}

export function mapLiveStatus(r: LiveStatusRow, nextCheckAt?: string | null): LiveStatus {
  return {
    state: r.state,
    videoId: r.video_id ?? undefined,
    title: r.title ?? undefined,
    startTime: r.start_time ?? undefined,
    thumbnailUrl: r.video_id ? thumbnailFor(r.video_id) : undefined,
    checkedAt: r.checked_at ?? new Date(0).toISOString(),
    ...(nextCheckAt ? { nextCheckAt } : {}),
  };
}
