import Image from "next/image";
import { youtubeUrl } from "@/lib/links";
import { formatDate, formatDuration, formatViews } from "@/lib/format";
import type { ClassifiedVideo } from "@/lib/data";
import type { Game } from "@/lib/types";

export function VideoCard({ video, game }: { video: ClassifiedVideo; game?: Game }) {
  return (
    <a
      href={youtubeUrl(video.videoId)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className={`relative aspect-video bg-gradient-to-br ${game?.cover ?? "from-zinc-400 to-zinc-700"}`}>
        {video.thumbnailUrl && (
          <Image src={video.thumbnailUrl} alt="" fill sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        )}
        <span className="absolute right-2 bottom-2 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white">
          {formatDuration(video.durationMinutes)}
        </span>
        {video.wasLive && (
          <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">Đã phát trực tiếp</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:underline">{video.title}</h3>
        <p className="mt-1 text-xs text-muted">
          {game?.name ?? "Chưa phân loại"} · {formatViews(video.viewCount)} lượt xem · {formatDate(video.publishedAt)}
        </p>
      </div>
    </a>
  );
}
