import { ReportButton } from "@/features/reports/components/report-button";
import type { GameCover } from "@/features/videos/lib/game-cover";
import { formatDate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";
import { GameThumb } from "./game-thumb";
import { allowedSuggestionUrl } from "../lib/url-policy";
import type { Suggestion } from "../types";
import { SOURCE, STATUS } from "./labels";
import { VoteButton } from "./vote-button";

interface Props {
  suggestion: Suggestion;
  voted: boolean;
  onVote: () => void;
  /** Stream thumbnail of the game this suggestion is linked to; shown only when there is no Steam image. */
  gameCover?: GameCover;
}

export function SuggestionItem({ suggestion: s, voted, onVote, gameCover }: Props) {
  // Re-checked at render so rows saved before the host allowlist never become links.
  const href = allowedSuggestionUrl(s.url);
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-surface p-4 shadow-card">
      <VoteButton name={s.name} count={s.upvotes} voted={voted} onVote={onVote} />
      {/* Shown on phones too (it used to be hidden below sm). */}
      <GameThumb
        sources={[s.steam?.headerImage, gameCover?.thumbnailUrl]}
        name={s.name}
        sizes="(min-width: 640px) 9rem, 5rem"
        className={cn("w-20 sm:w-36", s.steam?.headerImage ? "aspect-[460/215]" : "aspect-video")}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc" className="hover:underline">
                {s.name}
              </a>
            ) : (
              s.name
            )}
          </h3>
          <Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge>
          <Badge tone={SOURCE[s.source].tone}>{SOURCE[s.source].label}</Badge>
        </div>
        <p className="mt-1 text-sm break-words">{s.reason}</p>
        {s.steam && (
          <p className="mt-1 text-xs text-muted">
            {s.steam.price} · {s.steam.genres.join(", ")}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            {s.author}
            {s.authorVerified && (
              <span className="ml-1 rounded bg-cleared/15 px-1.5 font-semibold text-cleared" title="Tài khoản đã xác minh là anh Độ / team Kênh MixiGaming">
                ✓ Chính chủ
              </span>
            )}{" "}
            · {formatDate(s.createdAt)}
          </span>
          <ReportButton kind="suggestion" targetId={s.id} authorId={s.authorId} demo={!s.authorId} />
        </div>
      </div>
    </div>
  );
}
