import type { ClassifiedVideo, Game } from "../types";
import { VideoCard } from "./video-card";

/** Horizontal, swipeable row of videos (CSS scroll-snap, no JS). */
export function VideoRail({ videos, games }: { videos: ClassifiedVideo[]; games: Game[] }) {
  const bySlug = new Map(games.map((g) => [g.slug, g]));
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]" aria-label="Video mới nhất">
      {videos.map((v) => (
        <li key={v.videoId} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]">
          <VideoCard video={v} game={bySlug.get(v.gameSlug)} />
        </li>
      ))}
    </ul>
  );
}
