import Link from "next/link";
import type { ReactNode } from "react";
import type { GameCoverRecord } from "@/features/videos/lib/game-cover";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";
import { IconGameViewer, IconKindle, IconSuggest, IconUpvote } from "@/shared/ui/icons";
import type { LineupPick, LineupReason } from "../lib/ranking";
import { allowedSuggestionUrl } from "../lib/url-policy";
import { GameThumb } from "./game-thumb";
import { REASON_TONE, SOURCE } from "./labels";

const REASON_ICON: Record<LineupReason, ReactNode> = {
  hot: <IconKindle size={14} />,
  new: <IconSuggest size={14} />,
  fan: <IconGameViewer size={14} />,
};

interface Props {
  /** From `getTonightLineup()` (`@/features/suggestions/server/lineup`) or `tonightLineup()`. */
  picks: LineupPick[];
  /** Stream thumbnails by game slug, a last-resort cover for linked games. */
  covers?: GameCoverRecord;
  /** Shows a "Xem tất cả đề xuất" link (e.g. "/de-xuat" on the home page). */
  moreHref?: string;
  /** Heading id, for `aria-labelledby` on the parent section. */
  headingId?: string;
  className?: string;
}

/**
 * "Ứng viên tối nay": anh Độ plays one game a night; these are the 5 candidates Bộ Tộc
 * surfaces (hot + newest + fan-made, see `tonightLineup`). Presentational, server-friendly.
 */
export function TonightLineup({ picks, covers, moreHref, headingId = "ung-vien-toi-nay", className }: Props) {
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className={cn("rounded-lg border border-border bg-surface p-4 shadow-card sm:p-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={headingId} className="flex items-center gap-2 text-xl font-black tracking-tight">
            <IconKindle size={22} className="text-accent" />
            Ứng viên tối nay
          </h2>
          <p className="mt-1 text-sm text-muted">
            Đây là {picks.length} game Bộ Tộc đề xuất cho buổi live tới: game đang hot, game mới đề xuất và game Bộ Tộc tự làm.
          </p>
        </div>
        {moreHref && (
          <Link href={moreHref} className="text-sm font-semibold text-accent underline underline-offset-2">
            Xem tất cả đề xuất
          </Link>
        )}
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {picks.map(({ suggestion: s, reason, label }) => {
          const href = s.steam?.appId ? `https://store.steampowered.com/app/${s.steam.appId}` : allowedSuggestionUrl(s.url);
          const cover = s.linkedGameSlug ? covers?.[s.linkedGameSlug] : undefined;
          return (
            <li key={s.id} className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-background">
              <GameThumb
                sources={[s.thumbnailUrl, s.steam?.headerImage, cover?.thumbnailUrl]}
                name={s.name}
                sizes="(min-width: 1024px) 14rem, (min-width: 640px) 33vw, 50vw"
                className="aspect-video w-full rounded-none"
              />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <Badge tone={REASON_TONE[reason]} icon={REASON_ICON[reason]} className="self-start">
                  {label}
                </Badge>
                <h3 className="line-clamp-2 text-sm leading-snug font-bold">
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc" className="hover:underline">
                      {s.name}
                    </a>
                  ) : (
                    s.name
                  )}
                </h3>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-1 text-xs text-muted">
                  <span>{SOURCE[s.source].label}</span>
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-foreground tabular-nums">
                    <IconUpvote size={14} className="text-accent" />
                    {s.upvotes}
                    <span className="sr-only"> phiếu</span>
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
