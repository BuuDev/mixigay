import { youtubeUrl } from "@/shared/lib/links";
import { cn } from "@/shared/ui/cn";
import { formatTimestamp } from "../lib/chapters";
import type { Chapter } from "../types";

/**
 * "Timeline buổi stream" (COMPONENTS.md §7): a vertical list on an axis, one row
 * per chapter. Each time opens the video on YouTube at that moment (ADR-002:
 * link out, never embed).
 */
export function ChapterTimeline({ videoId, chapters, label, className }: { videoId: string; chapters: Chapter[]; label: string; className?: string }) {
  return (
    <ol aria-label={label} className={cn("relative ml-2 space-y-1 border-l-2 border-border pl-4", className)}>
      {chapters.map((c) => (
        <li key={c.t} className="relative">
          <span aria-hidden className="absolute top-3 -left-[1.4rem] size-2.5 rounded-pill bg-accent shadow-[0_0_8px_var(--td-ember)]" />
          <a
            href={youtubeUrl(videoId, c.t)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-8 items-baseline gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-raised"
          >
            <span className="shrink-0 font-mono text-sm font-bold text-accent tabular-nums">{formatTimestamp(c.t)}</span>
            <span className="text-sm group-hover:underline">{c.title}</span>
            <span className="sr-only">(mở trên YouTube)</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
