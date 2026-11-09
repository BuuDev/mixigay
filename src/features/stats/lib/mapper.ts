import type { LiveSample, StreamMeta } from "../types";

export interface LiveSampleRow {
  video_id: string;
  sampled_at: string;
  concurrent_viewers: number | string | null;
}

export interface StreamMetaRow {
  video_id: string;
  title: string | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
}

export function mapSample(r: LiveSampleRow): LiveSample {
  const viewers = Number(r.concurrent_viewers ?? 0);
  return { videoId: r.video_id, sampledAt: r.sampled_at, viewers: Number.isFinite(viewers) ? viewers : 0 };
}

export function mapStreamMeta(r: StreamMetaRow): StreamMeta {
  return {
    videoId: r.video_id,
    title: r.title ?? "",
    actualStartAt: r.actual_start_at ?? undefined,
    actualEndAt: r.actual_end_at ?? undefined,
  };
}
