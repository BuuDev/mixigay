import { youtubeUrl } from "@/shared/lib/links";
import { isYoutubeVideoId } from "../lib/video-id";
import { IconExternal } from "@/shared/ui/icons";
import { formatCount, formatLength, formatVnDate } from "../lib/vn-time";
import type { StreamSummary } from "../types";

/** Streams ranked by their highest concurrent audience, each linking out to YouTube. */
export function TopStreams({ streams }: { streams: StreamSummary[] }) {
  const max = streams[0]?.peakViewers || 1;
  return (
    <ol className="space-y-3">
      {streams.map((s, i) => (
        <li key={s.videoId} className="grid grid-cols-[2rem_1fr] gap-x-2">
          <span className="pt-0.5 text-right text-sm font-bold text-muted tabular-nums">{i + 1}.</span>
          <div className="min-w-0">
            <a
              href={isYoutubeVideoId(s.videoId) ? youtubeUrl(s.videoId) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-start gap-1.5 text-sm font-semibold hover:underline"
            >
              <span className="line-clamp-2 min-w-0 break-words">{s.title || "Buổi live không rõ tiêu đề"}</span>
              <IconExternal size={14} className="mt-0.5 shrink-0 text-muted" />
              <span className="sr-only">(mở trên YouTube)</span>
            </a>
            <div className="mt-1.5 flex items-center gap-2">
              <div aria-hidden className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-raised">
                <div className="h-full rounded-pill bg-accent" style={{ width: `${Math.max(2, (s.peakViewers / max) * 100)}%` }} />
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums">
                {formatCount(s.peakViewers)}
                <span className="sr-only"> người xem cùng lúc</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {formatVnDate(s.startAt)} · dài {formatLength(s.durationMinutes)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
