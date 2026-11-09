import type { Suggestion } from "@/features/suggestions/types";
import type { Game } from "@/features/videos/types";
import { formatDate } from "@/shared/lib/format";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { IconCleared, IconDropped, IconLive } from "@/shared/ui/icons.generated";
import type { PlayedGame, PlayStatus } from "../types";

const SECTIONS: { status: PlayStatus; title: string; tone: BadgeTone; icon: typeof IconLive }[] = [
  { status: "playing", title: "Đang chơi", tone: "accent", icon: IconLive },
  { status: "finished", title: "Đã phá đảo", tone: "cleared", icon: IconCleared },
  { status: "dropped", title: "Đã drop", tone: "muted", icon: IconDropped },
];

/** "Độ đã chơi", grouped by status; marks games that came from fan suggestions. */
export function PlayedList({ played, games, suggestions }: { played: PlayedGame[]; games: Game[]; suggestions: Suggestion[] }) {
  const bySlug = new Map(games.map((g) => [g.slug, g]));
  const fromFans = new Map(suggestions.filter((s) => s.linkedGameSlug).map((s) => [s.linkedGameSlug!, s]));

  return (
    <>
      {SECTIONS.map(({ status, title, tone, icon: Icon }) => {
        const rows = played.filter((p) => p.status === status);
        if (!rows.length) return null;
        return (
          <section key={status}>
            <h2 className="flex items-center gap-2 font-bold">
              <Icon size={18} /> {title}
            </h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((p) => {
                const game = bySlug.get(p.gameSlug);
                const fan = fromFans.get(p.gameSlug);
                return (
                  <Card key={p.gameSlug} className="flex items-center gap-3 p-3">
                    <div className={`size-12 shrink-0 rounded-md bg-gradient-to-br ${game?.cover ?? "from-zinc-600 to-zinc-800"}`} />
                    <div className="min-w-0">
                      <div className="font-semibold">{game?.name ?? p.gameSlug}</div>
                      <div className="text-xs text-muted">
                        {p.sessions} buổi{p.lastPlayed && ` · lần cuối ${formatDate(p.lastPlayed)}`}
                      </div>
                      {fan && (
                        <Badge tone={tone} className="mt-1">
                          Fan đề xuất · {fan.upvotes} vote
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
