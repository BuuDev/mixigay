import type { Series } from "../lib/series";
import { SeriesCard } from "./series-card";

/** Swipeable row of series cards (CSS scroll-snap). */
export function SeriesRail({ series }: { series: Series[] }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]" aria-label="Series đang hot">
      {series.map((s) => (
        <li key={s.slug} className="flex w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[31%] [&>*]:w-full">
          <SeriesCard series={s} />
        </li>
      ))}
    </ul>
  );
}
