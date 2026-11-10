import { SmartImage as Image } from "@/shared/ui/smart-image";
import { formatDate, formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { Illustration } from "@/shared/ui/brand-art";
import type { ClassifiedVideo } from "../types";

/** Vertical 9:16 card for a Short; opens it on YouTube (ADR-002: never embedded). */
export function ShortCard({ video }: { video: ClassifiedVideo }) {
  return (
    <a
      href={youtubeUrl(video.videoId)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/60"
    >
      <div className="relative aspect-[9/16] bg-surface-raised">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 12rem, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <Illustration name="thumb-placeholder" width={200} className="size-full object-cover" />
        )}
        <span className="absolute top-2 left-2 rounded-sm bg-black/75 px-1.5 py-0.5 text-xs font-bold text-white">Shorts</span>
      </div>
      {/* Equal-height cards: the title always reserves two lines, the meta line sits at the bottom. */}
      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-2 min-h-[2lh] text-sm font-semibold group-hover:underline">{video.title}</h3>
        <p className="mt-auto pt-1 text-xs text-muted">
          {formatViews(video.viewCount)} lượt xem · {formatDate(video.publishedAt)}
        </p>
      </div>
    </a>
  );
}
