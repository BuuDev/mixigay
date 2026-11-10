import type { Tournament, TournamentKind, TournamentStatus } from "../types";
import { TOURNAMENT_STATUSES } from "../types";

export const STATUS_LABEL: Record<TournamentStatus, string> = {
  running: "Đang diễn ra",
  upcoming: "Sắp tới",
  finished: "Đã xong",
};

export const KIND_LABEL: Record<TournamentKind, string> = {
  "ao-lang": "Ao Làng",
  "moi-xoang": "Moi Xoang",
  tetris: "Tetris",
  other: "Giải khác",
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "2026-11-10" → "10/11/2026". The value is a calendar date already in Vietnam
 * time (a Postgres `date`), so it is reformatted as text: going through `Date`
 * would shift it by the viewer's UTC offset.
 */
export function formatDateVn(date: string): string {
  const m = DATE_RE.exec(date);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

/** Human date range, or null when admin has not entered any date yet. */
export function formatDateRange(startsOn: string | null, endsOn: string | null): string | null {
  if (startsOn && endsOn) return startsOn === endsOn ? formatDateVn(startsOn) : `${formatDateVn(startsOn)} – ${formatDateVn(endsOn)}`;
  if (startsOn) return `Từ ${formatDateVn(startsOn)}`;
  if (endsOn) return `Đến ${formatDateVn(endsOn)}`;
  return null;
}

export interface TournamentGroup {
  status: TournamentStatus;
  label: string;
  items: Tournament[];
}

// ISO dates compare correctly as strings; undated ones go last.
const byStartAsc = (a: Tournament, b: Tournament) => (a.startsOn ?? "9999").localeCompare(b.startsOn ?? "9999") || a.name.localeCompare(b.name, "vi");
const byEndDesc = (a: Tournament, b: Tournament) =>
  (b.endsOn ?? b.startsOn ?? "").localeCompare(a.endsOn ?? a.startsOn ?? "") || a.name.localeCompare(b.name, "vi");

/** Running first, then upcoming (soonest first), then finished (latest first). Empty groups are dropped. */
export function groupByStatus(list: Tournament[]): TournamentGroup[] {
  return TOURNAMENT_STATUSES.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    items: list.filter((t) => t.status === status).sort(status === "finished" ? byEndDesc : byStartAsc),
  })).filter((g) => g.items.length > 0);
}
