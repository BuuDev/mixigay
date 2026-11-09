"use client";

import { m, rise, stagger } from "@/shared/motion";
import { EmptyState } from "@/shared/ui/empty-state";
import type { ClassifiedVideo, Game } from "../types";
import { VideoCard } from "./video-card";

const container = stagger(0.04);

/**
 * Responsive grid of video cards that cascade in. Pass a changing `animationKey`
 * (e.g. the active filter) to replay the cascade when the list changes.
 */
export function VideoGrid({ videos, games, animationKey = "all" }: { videos: ClassifiedVideo[]; games: Game[]; animationKey?: string }) {
  if (!videos.length) {
    return <EmptyState art="empty-videos" title="Chưa có video nào ở đây" />;
  }
  const bySlug = new Map(games.map((g) => [g.slug, g]));
  return (
    <m.ul key={animationKey} variants={container} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <m.li key={v.videoId} variants={rise}>
          <VideoCard video={v} game={bySlug.get(v.gameSlug)} />
        </m.li>
      ))}
    </m.ul>
  );
}
