import { thumbnailFor } from "@/shared/lib/links";
import type { Video } from "@/features/videos/types";

/** The few fields a marquee tile needs: only these leave the full channel list. */
export interface Moment {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
}

export interface MomentRows {
  popular: Moment[];
  latest: Moment[];
}

/** Below this a row cannot fill a desktop screen, so the marquee is not shown. */
export const MIN_ROW = 4;

function toMoment(v: Video): Moment {
  return { videoId: v.videoId, title: v.title, thumbnailUrl: v.thumbnailUrl ?? thumbnailFor(v.videoId), viewCount: v.viewCount };
}

/**
 * Two marquee rows: the most-viewed videos, then the newest ones not already in the
 * first row. Ties break on video id so the order is stable between renders.
 */
export function pickMoments(videos: readonly Video[], perRow = 12): MomentRows {
  const popular = [...videos].sort((a, b) => b.viewCount - a.viewCount || a.videoId.localeCompare(b.videoId)).slice(0, perRow);
  const taken = new Set(popular.map((v) => v.videoId));
  const latest = videos
    .filter((v) => !taken.has(v.videoId))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.videoId.localeCompare(b.videoId))
    .slice(0, perRow);
  return { popular: popular.map(toMoment), latest: latest.map(toMoment) };
}

/** Real numbers for the hero, counted from the videos the site already has (no shorts). */
export function channelStats(videos: readonly Video[]): { videos: number; streams: number; views: number } {
  let streams = 0;
  let views = 0;
  for (const v of videos) {
    if (v.wasLive) streams += 1;
    views += v.viewCount;
  }
  return { videos: videos.length, streams, views };
}
