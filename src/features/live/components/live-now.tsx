import Image from "next/image";
import { formatCountdown } from "@/features/schedule/lib/countdown";
import { formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { LiveBadge } from "@/shared/ui/badge";
import { Mascot } from "@/shared/ui/brand-art";
import { buttonClass } from "@/shared/ui/button";
import type { LiveStatus } from "../types";

export function LiveNow({ status, now }: { status: LiveStatus; now: Date | null }) {
  const started = status.startTime ? Date.parse(status.startTime) : undefined;
  return (
    <a href={youtubeUrl(status.videoId!)} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-surface-raised sm:w-72">
        {status.thumbnailUrl && <Image src={status.thumbnailUrl} alt="" fill sizes="(min-width: 640px) 18rem, 100vw" className="object-cover" />}
        <Mascot pose="live" size={56} decorative className="absolute -right-1 -bottom-1 drop-shadow-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <LiveBadge viewers={status.concurrentViewers ? formatViews(status.concurrentViewers) : undefined} />
        <h2 className="mt-2 text-xl leading-tight font-extrabold group-hover:underline sm:text-2xl">{status.title}</h2>
        {now && started && now.getTime() > started && <p className="mt-1 text-sm text-muted">Đã live {formatCountdown(now.getTime() - started)}</p>}
        <span className={buttonClass("primary", "md", "mt-4")}>
          Xem trên YouTube <span aria-hidden>↗</span>
        </span>
      </div>
    </a>
  );
}
