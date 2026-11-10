import { isSupabaseConfigured } from "@/shared/lib/env";
import { Mascot } from "@/shared/ui/brand-art";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { featuredPoll } from "../lib/results";
import { getMyPollVote, getPollBoard } from "../server/queries";
import { PollCard } from "./poll-card";

/**
 * Drop-in for the home page. Dynamic (reads the session for the viewer's own vote):
 * render it under <Suspense>. With no open or closed poll it shows a small placeholder card,
 * so the home grid keeps its shape and the hero "Bình chọn" shortcut never lands on nothing.
 */
export async function HomePoll({ headingLevel = 2, className }: { headingLevel?: 2 | 3; className?: string }) {
  const board = await getPollBoard();
  const poll = featuredPoll(board);
  if (!poll) {
    const H = headingLevel === 3 ? "h3" : "h2";
    return (
      <Card className={cn("flex flex-col items-center justify-center gap-2 p-6 text-center", className)}>
        <Mascot pose="wait" size={96} decorative />
        <H className="font-bold">Chưa có bình chọn nào đang mở</H>
        <p className="text-sm text-muted">Admin mở bình chọn trước các buổi live, ví dụ “Tối nay anh Độ nên chơi game gì?”. Ghé lại sau nhé.</p>
      </Card>
    );
  }
  const viewer = await getMyPollVote(poll.id);
  return (
    <PollCard
      key={poll.id}
      poll={poll}
      viewer={viewer}
      mode={isSupabaseConfigured ? "live" : "demo"}
      previous={board.current ? board.previous : null}
      headingLevel={headingLevel}
      className={className}
    />
  );
}
