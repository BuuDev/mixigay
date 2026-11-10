import { EmptyState } from "@/shared/ui/empty-state";
import { groupByStatus } from "../lib/tournaments";
import type { Tournament } from "../types";
import { TournamentCard } from "./tournament-card";

/** Tournaments grouped by status: each group is an h2 over a grid of equal-height h3 cards. */
export function TournamentBoard({ tournaments }: { tournaments: Tournament[] }) {
  const groups = groupByStatus(tournaments);
  if (!groups.length) {
    return (
      <EmptyState mascot="esport" title="Chưa có giải đấu nào">
        Admin sẽ thêm giải khi có thông tin từ sóng chính thức.
      </EmptyState>
    );
  }
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.status} aria-labelledby={`giai-${g.status}`} className="space-y-3">
          <h2 id={`giai-${g.status}`} className="text-xl font-bold">
            {g.label} <span className="text-base font-semibold text-muted">({g.items.length})</span>
          </h2>
          <ul className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((t) => (
              <li key={t.slug} className="h-full">
                <TournamentCard tournament={t} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
