import type { ClassifiedVideo } from "../types";
import { ShortCard } from "./short-card";

/** Horizontal, swipeable row of vertical Shorts cards (CSS scroll-snap, no JS). */
export function ShortsRail({ shorts }: { shorts: ClassifiedVideo[] }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]" aria-label="Shorts mới nhất">
      {shorts.map((v) => (
        <li key={v.videoId} className="flex w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[18%] [&>*]:w-full">
          <ShortCard video={v} />
        </li>
      ))}
    </ul>
  );
}
