import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { formatDate, formatViews } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import type { Series } from "../lib/series";
import { KIND_LABEL, SERIES_META } from "../lib/meta";
import { seriesCoverName } from "./series-hero";

/**
 * Card linking to a series page. The cover is a named <ViewTransition> that morphs
 * into the page's hero ("nav-forward"); the full route is prefetched so the hero is
 * rendered when the navigation commits and the pair can form.
 */
export function SeriesCard({ series }: { series: Series }) {
  const meta = SERIES_META[series.slug];
  const cover = series.episodes[0];
  const latestEp = series.episodes.find((e) => e.episode !== undefined)?.episode;
  return (
    <Link
      href={`/series/${series.slug}`}
      prefetch
      transitionTypes={["nav-forward"]}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent/60"
    >
      <div className="relative aspect-video bg-surface-raised">
        {cover.thumbnailUrl && (
          <ViewTransition name={seriesCoverName(series.slug)} share="td-morph" default="none">
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={cover.thumbnailUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 22rem, 80vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
          </ViewTransition>
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/60 via-35% to-transparent to-70%" />
        <div className="absolute right-3 bottom-2 left-3">
          {meta && <Badge tone="accent">{KIND_LABEL[meta.kind]}</Badge>}
          <h3 className="mt-1 line-clamp-2 text-lg leading-tight font-black">{series.name}</h3>
        </div>
        {latestEp !== undefined && (
          <span className="absolute top-2 right-2 font-mono text-3xl font-black text-transparent [-webkit-text-stroke:1.2px_var(--td-ember-glow)]">
            #{latestEp}
          </span>
        )}
      </div>
      {/* Equal-height cards: the blurb always reserves two lines, the meta line sits at the bottom. */}
      <div className="flex flex-1 flex-col p-3 text-sm">
        <p className="line-clamp-2 min-h-[2lh] text-muted">{meta?.blurb}</p>
        <p className="mt-auto pt-1 text-xs text-muted">
          {series.episodes.length} tập · {formatViews(series.totalViews)} lượt xem · mới nhất {formatDate(series.latestAt)}
        </p>
      </div>
    </Link>
  );
}
