import { ReportButton } from "@/features/reports/components/report-button";
import { RelativeTime } from "@/features/wall/components/relative-time";
import { Badge } from "@/shared/ui/badge";
import { buttonClass } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { IconCleared, IconExternal } from "@/shared/ui/icons";
import { playedMomentUrl, QUIZ_PLATFORM_LABEL } from "../lib/quiz-url";
import type { QuizLink } from "../types";

/**
 * One fan-made quiz: platform, title, who shared it and a link out to the platform
 * (never embedded). When anh Độ played it, a link to that stream moment on YouTube.
 * `badge` marks the author's own pending link (no report button then).
 */
export function QuizLinkCard({ link: l, badge, headingLevel = 3 }: { link: QuizLink; badge?: string; headingLevel?: 3 | 4 }) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <Card className={cn("flex h-full flex-col gap-3 p-4", badge && "border-dashed")}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="steam">{QUIZ_PLATFORM_LABEL[l.platform]}</Badge>
        {l.playedVideoId && (
          <Badge tone="cleared" icon={<IconCleared size={14} aria-hidden />}>
            Anh Độ đã chơi
          </Badge>
        )}
        {badge && <Badge tone="accent">{badge}</Badge>}
      </div>
      <Heading className="line-clamp-2 min-h-[2lh] font-semibold break-words">{l.title}</Heading>
      {l.description && <p className="line-clamp-3 text-sm break-words text-muted">{l.description}</p>}
      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href={l.url} target="_blank" rel="noopener noreferrer nofollow ugc" className={buttonClass("primary", "sm", "min-h-11 sm:min-h-0")}>
            Mở quiz
            <IconExternal size={14} aria-hidden />
            <span className="sr-only">{`“${l.title}” trên ${QUIZ_PLATFORM_LABEL[l.platform]} (mở tab mới)`}</span>
          </a>
          {l.playedVideoId && (
            <a
              href={playedMomentUrl(l.playedVideoId, l.playedAtSeconds)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-6 items-center gap-1 text-sm font-semibold underline underline-offset-2 hover:text-accent"
            >
              Xem đoạn chơi trên YouTube
              <IconExternal size={14} aria-hidden />
              <span className="sr-only">(mở tab mới)</span>
            </a>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>
            Góp bởi <span className="font-semibold text-foreground">{l.author}</span>
          </span>
          <span aria-hidden>·</span>
          <RelativeTime iso={l.createdAt} />
          {/* Approved, real links only (pending cards carry a badge). */}
          {!badge && l.approved && l.authorId && (
            <div className="ml-auto">
              <ReportButton kind="quiz_link" targetId={l.id} authorId={l.authorId} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
