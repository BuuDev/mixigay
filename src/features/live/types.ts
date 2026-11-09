export type LiveState = "live" | "upcoming" | "offline";

export interface LiveStatus {
  state: LiveState;
  videoId?: string;
  title?: string;
  /** ISO time; for "upcoming" it is the scheduled start, for "live" the actual start. */
  startTime?: string;
  concurrentViewers?: number;
  thumbnailUrl?: string;
  /** ISO time of the last poll against YouTube. */
  checkedAt: string;
}
