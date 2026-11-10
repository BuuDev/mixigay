import { SmartImage as Image } from "@/shared/ui/smart-image";
import { formatCountdown } from "@/features/schedule/lib/countdown";
import { youtubeUrl } from "@/shared/lib/links";
import { LiveBadge } from "@/shared/ui/badge";
import { Illustration } from "@/shared/ui/brand-art";
import { buttonClass } from "@/shared/ui/button";
import type { LiveStatus } from "../types";

/**
 * The live card. The thumbnail keeps YouTube's 16:9 so nothing is cropped away, and it is
 * a plain rounded frame: the hero already has one arch (anh Độ's portrait), a second one
 * next to it read as two competing portraits. Titles are clamped to two lines because
 * real stream titles run long (and sometimes end in rows of dots).
 */
export function LiveNow({ status, now }: { status: LiveStatus; now: Date | null }) {
  const started = status.startTime ? Date.parse(status.startTime) : undefined;
  return (
    <a href={youtubeUrl(status.videoId!)} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-card sm:w-72">
        {status.thumbnailUrl ? (
          <Image
            src={status.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 18rem, calc(100vw - 5rem)"
            className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <Illustration name="intro-lit" width={200} className="absolute inset-0 m-auto" />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
      </div>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <LiveBadge />
        <h2 title={status.title} className="mt-3 line-clamp-2 text-xl leading-tight font-black [overflow-wrap:anywhere] group-hover:underline sm:text-2xl">
          {status.title}
        </h2>
        {now && started && now.getTime() > started && <p className="mt-2 text-sm text-muted">Đã live {formatCountdown(now.getTime() - started)}</p>}
        <span className={buttonClass("primary", "md", "mt-4 min-h-11")}>
          Xem trên YouTube <span aria-hidden>↗</span>
          <span className="sr-only">(mở tab mới)</span>
        </span>
      </div>
    </a>
  );
}
