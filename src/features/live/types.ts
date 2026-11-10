export type LiveState = "live" | "upcoming" | "offline";

export interface LiveStatus {
  state: LiveState;
  videoId?: string;
  title?: string;
  /** ISO time; for "upcoming" it is the scheduled start, for "live" the actual start. */
  startTime?: string;
  thumbnailUrl?: string;
  /** ISO time live_status last changed. */
  checkedAt: string;
  /** ISO time of poll-live's next check: browsers re-read the state only then (ADR-019). */
  nextCheckAt?: string;
}
