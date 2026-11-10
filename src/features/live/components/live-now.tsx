import Image from "next/image";
import { formatCountdown } from "@/features/schedule/lib/countdown";
import { formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { ArchFrame } from "@/shared/ui/arch-frame";
import { LiveBadge } from "@/shared/ui/badge";
import { Illustration, Mascot } from "@/shared/ui/brand-art";
import { buttonClass } from "@/shared/ui/button";
import type { LiveStatus } from "../types";
import { LiveHud } from "./live-hud";

export function LiveNow({ status, now }: { status: LiveStatus; now: Date | null }) {
  const started = status.startTime ? Date.parse(status.startTime) : undefined;
  return (
    <a href={youtubeUrl(status.videoId!)} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <ArchFrame className="aspect-[4/5] w-full max-w-64 shrink-0 sm:w-56">
        {status.thumbnailUrl ? (
          <Image src={status.thumbnailUrl} alt="" fill sizes="16rem" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Illustration name="intro-lit" width={240} className="absolute inset-0 m-auto" />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        {status.concurrentViewers ? <LiveHud viewers={status.concurrentViewers} /> : null}
        <Mascot pose="live" size={64} decorative className="absolute bottom-1 left-1 drop-shadow-lg" />
      </ArchFrame>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <LiveBadge viewers={status.concurrentViewers ? formatViews(status.concurrentViewers) : undefined} />
        <h2 className="mt-3 text-2xl leading-tight font-black group-hover:underline sm:text-3xl">{status.title}</h2>
        {now && started && now.getTime() > started && <p className="mt-2 text-sm text-muted">Đã live {formatCountdown(now.getTime() - started)}</p>}
        <span className={buttonClass("primary", "lg", "mt-5")}>
          Xem trên YouTube <span aria-hidden>↗</span>
        </span>
      </div>
    </a>
  );
}
