import { ReportButton } from "@/features/reports/components/report-button";
import { RelativeTime } from "@/features/wall/components/relative-time";
import { VerifiedMark } from "@/features/wall/components/wall-message-card";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { IconExternal } from "@/shared/ui/icons";
import { formatClock, quoteMomentUrl } from "../lib/moment";
import type { Quote } from "../types";

/** One remembered moment: the line, where it was said (link out to YouTube, never embedded) and who sent it. */
export function QuoteCard({ quote: q, badge, className }: { quote: Quote; badge?: string; className?: string }) {
  const clock = formatClock(q.atSeconds);
  return (
    <Card className={cn("flex h-full flex-col gap-3 p-4", badge && "border-dashed", className)}>
      <blockquote className="flex-1 text-base leading-relaxed break-words">“{q.body}”</blockquote>
      <p className="flex items-start gap-2 text-sm">
        <a
          href={quoteMomentUrl(q.videoId, q.atSeconds)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-6 shrink-0 items-center gap-1 rounded font-mono font-semibold text-foreground underline underline-offset-2 hover:text-accent"
        >
          <span className="sr-only">Mở trên YouTube tại </span>
          {clock}
          <IconExternal size={14} aria-hidden />
        </a>
        <span className="line-clamp-2 min-w-0 text-muted">{q.videoTitle ?? "Video trên kênh"}</span>
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className="font-semibold text-foreground">{q.author}</span>
        {q.authorVerified && <VerifiedMark />}
        <span aria-hidden>·</span>
        <RelativeTime iso={q.createdAt} />
        {badge && <Badge tone="accent">{badge}</Badge>}
        {/* Approved, real quotes only (pending cards carry a badge; demo ones have no author id). */}
        {!badge && q.authorId && (
          <span className="ml-auto">
            <ReportButton kind="quote" targetId={q.id} authorId={q.authorId} />
          </span>
        )}
      </div>
    </Card>
  );
}
