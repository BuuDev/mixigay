import Image from "next/image";
import { formatDate, formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import type { Series } from "../lib/series";

/** Episodes of one series, newest first; each opens on YouTube. */
export function EpisodeList({ series }: { series: Series }) {
  return (
    <ol className="space-y-3">
      {series.episodes.map((e) => (
        <li key={e.videoId}>
          <a
            href={youtubeUrl(e.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 rounded-lg border border-border bg-surface p-2 shadow-card transition-colors hover:border-accent/60"
          >
            <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-md bg-surface-raised sm:w-48">
              {e.thumbnailUrl && <Image src={e.thumbnailUrl} alt="" fill sizes="12rem" className="object-cover" />}
              {e.episode !== undefined && <span className="absolute top-1 left-1 rounded-sm bg-black/70 px-1.5 text-xs font-bold text-white">#{e.episode}</span>}
            </div>
            <div className="min-w-0 py-1">
              <p className="line-clamp-2 text-sm font-semibold group-hover:underline">{e.episodeTitle}</p>
              <p className="mt-1 text-xs text-muted">
                {formatViews(e.viewCount)} lượt xem · {formatDate(e.publishedAt)}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ol>
  );
}
