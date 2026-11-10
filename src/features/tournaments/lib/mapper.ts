import type { Tournament, TournamentKind, TournamentResult, TournamentStatus } from "../types";
import { TOURNAMENT_KINDS, TOURNAMENT_STATUSES } from "../types";

export interface TournamentResultRow {
  rank: number;
  name: string;
  note: string | null;
}

export interface TournamentRow {
  slug: string;
  name: string;
  kind: string;
  starts_on: string | null;
  ends_on: string | null;
  status: string;
  description: string | null;
  video_id: string | null;
  source_url: string | null;
  tournament_results?: TournamentResultRow[] | null;
}

export const TOURNAMENT_SELECT = "slug,name,kind,starts_on,ends_on,status,description,video_id,source_url,tournament_results(rank,name,note)";

const isKind = (v: string): v is TournamentKind => (TOURNAMENT_KINDS as readonly string[]).includes(v);
const isStatus = (v: string): v is TournamentStatus => (TOURNAMENT_STATUSES as readonly string[]).includes(v);

/** Row → domain. Returns null for a row that fails the DB's own checks, so one bad row cannot break the shared cache. */
export function mapTournament(r: TournamentRow): Tournament | null {
  if (!r.slug || !r.name || !isKind(r.kind) || !isStatus(r.status)) return null;
  const results: TournamentResult[] = (Array.isArray(r.tournament_results) ? r.tournament_results : [])
    .filter((x) => Number.isInteger(x.rank) && typeof x.name === "string" && x.name.length > 0)
    .map((x) => ({ rank: x.rank, name: x.name, note: x.note || null }))
    .sort((a, b) => a.rank - b.rank);
  return {
    slug: r.slug,
    name: r.name,
    kind: r.kind,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    status: r.status,
    description: r.description || null,
    videoId: r.video_id,
    sourceUrl: r.source_url?.startsWith("https://") ? r.source_url : null,
    results,
  };
}
