/** One row of `live_samples`: concurrent viewers of a live video at a minute. */
export interface LiveSample {
  videoId: string;
  /** UTC ISO instant. */
  sampledAt: string;
  viewers: number;
}

/** What `videos` knows about a stream (title, YouTube's own start/end when present). */
export interface StreamMeta {
  videoId: string;
  title: string;
  actualStartAt?: string;
  actualEndAt?: string;
}

/** A point on a viewers-over-time chart: minutes since the stream started, viewers. */
export interface ViewerPoint {
  minute: number;
  viewers: number;
}

/** One stream reconstructed from its samples. */
export interface StreamSummary {
  videoId: string;
  title: string;
  /** UTC ISO. YouTube's actual start when known, else the first sample. */
  startAt: string;
  /** UTC ISO. YouTube's actual end when known, else the last sample. */
  endAt: string;
  durationMinutes: number;
  peakViewers: number;
  /** Minutes after the start when the peak was sampled. */
  peakMinute: number;
  avgViewers: number;
  sampleCount: number;
}

export interface StreamSession extends StreamSummary {
  /** Every sample of the stream, oldest first. */
  points: ViewerPoint[];
}

/** A stream with a chart-sized series, sent to the client. */
export interface StreamSeries extends StreamSummary {
  points: ViewerPoint[];
}

/** Average start time for one weekday (Vietnam time). */
export interface WeekdayStart {
  /** 0 = Sunday … 6 = Saturday, of the "stream day" (see lib/vn-time.ts). */
  weekday: number;
  count: number;
  /** Minutes after 00:00 of the stream day; may exceed 1440 for after-midnight starts. Null when no stream. */
  avgStartMinute: number | null;
}

export interface StreamStreak {
  days: number;
  /** "YYYY-MM-DD" stream days (Vietnam time). */
  from: string;
  to: string;
}

export interface StreamStats {
  /** Length of the sample window the numbers cover. */
  windowDays: number;
  streamCount: number;
  avgDurationMinutes: number | null;
  streak: StreamStreak | null;
  weekdays: WeekdayStart[];
  /** Highest peak first. */
  top: StreamSummary[];
  /** Newest first, with downsampled series for the chart. */
  recent: StreamSeries[];
}
