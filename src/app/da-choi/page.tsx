import type { Metadata } from "next";
import { getGames, getPlayedGames, getSuggestions } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { PlayStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Độ đã chơi – Góc Fan Độ" };

const SECTIONS: { status: PlayStatus; title: string }[] = [
  { status: "playing", title: "Đang chơi" },
  { status: "finished", title: "Đã phá đảo" },
  { status: "dropped", title: "Đã drop" },
];

export default async function PlayedPage() {
  const [played, games, suggestions] = await Promise.all([getPlayedGames(), getGames(), getSuggestions()]);
  const bySlug = new Map(games.map((g) => [g.slug, g]));
  const fromFans = new Map(suggestions.filter((s) => s.linkedGameSlug).map((s) => [s.linkedGameSlug!, s]));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Độ đã chơi</h1>
      <p className="text-sm text-muted">Trước khi đề xuất game, xem qua danh sách này để tránh trùng nhé.</p>
      {SECTIONS.map(({ status, title }) => {
        const rows = played.filter((p) => p.status === status);
        if (!rows.length) return null;
        return (
          <section key={status}>
            <h2 className="font-semibold">{title}</h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((p) => {
                const game = bySlug.get(p.gameSlug);
                return (
                  <div key={p.gameSlug} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                    <div className={`size-12 shrink-0 rounded-lg bg-gradient-to-br ${game?.cover ?? "from-zinc-400 to-zinc-700"}`} />
                    <div>
                      <div className="font-medium">{game?.name ?? p.gameSlug}</div>
                      <div className="text-xs text-muted">
                        {p.sessions} buổi{p.lastPlayed && ` · lần cuối ${formatDate(p.lastPlayed)}`}
                      </div>
                      {fromFans.has(p.gameSlug) && (
                        <div className="text-xs text-accent">Fan đề xuất · {fromFans.get(p.gameSlug)!.upvotes} vote</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
