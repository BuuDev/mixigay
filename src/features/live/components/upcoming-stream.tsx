import { formatCountdown } from "@/features/schedule/lib/countdown";
import { youtubeUrl } from "@/shared/lib/links";
import { Badge } from "@/shared/ui/badge";
import { Mascot } from "@/shared/ui/brand-art";
import { buttonClass } from "@/shared/ui/button";
import { IconUpcoming } from "@/shared/ui/icons.generated";
import type { LiveStatus } from "../types";

/** A scheduled YouTube stream exists: count down to it and link to its page. */
export function UpcomingStream({ status, now }: { status: LiveStatus; now: Date | null }) {
  const at = Date.parse(status.startTime!);
  return (
    <a href={youtubeUrl(status.videoId!)} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <Badge tone="accent" icon={<IconUpcoming size={14} />}>
          SẮP LIVE
        </Badge>
        <h2 className="mt-2 text-xl font-extrabold group-hover:underline">{status.title}</h2>
        {now && (
          <>
            <p className="mt-1 text-sm text-muted">{new Date(at).toLocaleString("vi-VN", { weekday: "long", hour: "2-digit", minute: "2-digit" })} (giờ của bạn)</p>
            <p className="mt-3 font-mono text-4xl font-black tracking-tight tabular-nums">{formatCountdown(at - now.getTime())}</p>
          </>
        )}
        <span className={buttonClass("secondary", "sm", "mt-4")}>
          Bấm nhắc lịch trên YouTube <span aria-hidden>↗</span>
        </span>
      </div>
      <Mascot pose="wait" size={96} decorative className="hidden shrink-0 sm:block" />
    </a>
  );
}
