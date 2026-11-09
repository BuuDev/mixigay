import type { LiveSample, StreamMeta, StreamSession, ViewerPoint } from "../types";

const MINUTE_MS = 60_000;

/**
 * Rebuild streams from `live_samples`. A YouTube live broadcast keeps one video id
 * from start to end, so samples are grouped by video. Start/end come from YouTube's
 * own `actual_start_at`/`actual_end_at` when present and consistent with the samples,
 * else from the first/last sample. Samples with 0 viewers are poll gaps
 * (YouTube omitted `concurrentViewers`) and are left out of the series, peak and
 * average, but still bound the stream's start and end. Newest stream first.
 */
export function sessionize(samples: readonly LiveSample[], metas: readonly StreamMeta[] = []): StreamSession[] {
  const byVideo = new Map<string, { t: number; viewers: number }[]>();
  for (const s of samples) {
    const t = Date.parse(s.sampledAt);
    if (!Number.isFinite(t)) continue;
    const list = byVideo.get(s.videoId) ?? [];
    list.push({ t, viewers: Number.isFinite(s.viewers) ? s.viewers : 0 });
    byVideo.set(s.videoId, list);
  }
  const metaById = new Map(metas.map((m) => [m.videoId, m]));

  const sessions: StreamSession[] = [];
  for (const [videoId, list] of byVideo) {
    list.sort((a, b) => a.t - b.t);
    const first = list[0].t;
    const last = list[list.length - 1].t;
    const meta = metaById.get(videoId);
    const metaStart = meta?.actualStartAt ? Date.parse(meta.actualStartAt) : NaN;
    const metaEnd = meta?.actualEndAt ? Date.parse(meta.actualEndAt) : NaN;
    const start = Number.isFinite(metaStart) && metaStart <= first ? metaStart : first;
    const end = Number.isFinite(metaEnd) && metaEnd >= last ? metaEnd : last;

    const points: ViewerPoint[] = [];
    let peak = 0;
    let peakMinute = 0;
    let sum = 0;
    let prevT = NaN;
    for (const { t, viewers } of list) {
      if (t === prevT) continue; // duplicate instant
      prevT = t;
      if (viewers <= 0) continue;
      const minute = Math.round((t - start) / MINUTE_MS);
      points.push({ minute, viewers });
      sum += viewers;
      if (viewers > peak) {
        peak = viewers;
        peakMinute = minute;
      }
    }

    sessions.push({
      videoId,
      title: meta?.title ?? "",
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      durationMinutes: Math.round((end - start) / MINUTE_MS),
      peakViewers: peak,
      peakMinute,
      avgViewers: points.length ? Math.round(sum / points.length) : 0,
      sampleCount: points.length,
      points,
    });
  }
  return sessions.sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt) || a.videoId.localeCompare(b.videoId));
}

/**
 * Shrink a series to at most `max` points for drawing: one point per bucket, the
 * bucket's highest reading, so the peak stays on the line. First and last points
 * are always kept.
 */
export function downsample(points: readonly ViewerPoint[], max: number): ViewerPoint[] {
  if (points.length <= max || max < 3) return points.slice();
  const out: ViewerPoint[] = [points[0]];
  const inner = points.slice(1, -1);
  const buckets = max - 2;
  const size = inner.length / buckets;
  for (let b = 0; b < buckets; b++) {
    const from = Math.floor(b * size);
    const to = Math.max(from + 1, Math.floor((b + 1) * size));
    let best = inner[from];
    for (let i = from + 1; i < to && i < inner.length; i++) if (inner[i].viewers > best.viewers) best = inner[i];
    out.push(best);
  }
  out.push(points[points.length - 1]);
  return out;
}
