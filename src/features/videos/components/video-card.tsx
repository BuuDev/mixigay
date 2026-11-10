import { SmartImage as Image } from "@/shared/ui/smart-image";
import { formatDate, formatDuration, formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { Illustration } from "@/shared/ui/brand-art";
import type { ClassifiedVideo, Game } from "../types";

/** Links to YouTube (ADR-002: never embedded by default). */
export function VideoCard({ video, game }: { video: ClassifiedVideo; game?: Game }) {
  return (
    <a
      href={youtubeUrl(video.videoId)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/60"
    >
      <div className="relative aspect-video bg-surface-raised">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <Illustration name="thumb-placeholder" width={320} className="size-full object-cover" />
        )}
        <span className="absolute right-2 bottom-2 rounded-sm bg-black/75 px-1.5 py-0.5 text-xs text-white">{formatDuration(video.durationMinutes)}</span>
        {video.wasLive && <span className="absolute top-2 left-2 rounded-sm bg-black/60 px-1.5 py-0.5 text-xs text-white">Đã phát trực tiếp</span>}
      </div>
      {/* Equal-height cards in grids and rails: the title always reserves two lines, the meta line sits at the bottom. */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2lh] text-sm font-semibold group-hover:underline">{video.title}</h3>
        <p className="mt-auto pt-1 text-xs text-muted">
          {game?.name ?? "Chưa phân loại"} · {formatViews(video.viewCount)} lượt xem · {formatDate(video.publishedAt)}
        </p>
      </div>
    </a>
  );
}
