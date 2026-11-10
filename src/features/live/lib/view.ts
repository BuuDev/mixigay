import type { LiveStatus } from "../types";

/**
 * Whether a status is shown as "đang live": the state alone is not enough, every live
 * view links to the stream, so it also needs the video id. The hero card and the hero's
 * action row both use this, so they can never disagree on which button is primary.
 */
export function isLiveView(status: Pick<LiveStatus, "state" | "videoId">): boolean {
  return status.state === "live" && Boolean(status.videoId);
}
