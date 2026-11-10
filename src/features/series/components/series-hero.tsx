import Image from "next/image";
import { ViewTransition, type ReactNode } from "react";
import type { Series } from "../lib/series";

/** view-transition-name shared by a series' cover on its card and on its page. */
export const seriesCoverName = (slug: string) => `series-cover-${slug}`;

/**
 * Page-level wrapper for hierarchical navigation: slides on "nav-forward" /
 * "nav-back" (next/link `transitionTypes`), stays still for every other
 * navigation. Put it in each participating page.tsx, never in a layout.
 */
export function DirectionalTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "td-nav-forward", "nav-back": "td-nav-back", default: "none" }}
      exit={{ "nav-forward": "td-nav-forward", "nav-back": "td-nav-back", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

/**
 * Header of a series page: the newest episode's cover (the card's cover morphs
 * into it) next to the title and blurb. The cover is a picture only; episodes
 * open on YouTube from the list below.
 */
export function SeriesHero({ series, children }: { series: Series; children?: ReactNode }) {
  const cover = series.episodes[0];
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-end">
      {cover?.thumbnailUrl && (
        <ViewTransition name={seriesCoverName(series.slug)} share="td-morph" default="none">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-surface-raised shadow-card">
            <Image src={cover.thumbnailUrl} alt="" fill sizes="(min-width: 640px) 22rem, 100vw" preload className="object-cover" />
          </div>
        </ViewTransition>
      )}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{series.name}</h1>
        {children && <p className="max-w-prose text-sm text-muted">{children}</p>}
      </div>
    </div>
  );
}
