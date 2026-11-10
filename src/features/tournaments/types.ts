export const TOURNAMENT_KINDS = ["ao-lang", "moi-xoang", "tetris", "other"] as const;
export type TournamentKind = (typeof TOURNAMENT_KINDS)[number];

export const TOURNAMENT_STATUSES = ["running", "upcoming", "finished"] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export interface TournamentResult {
  rank: number;
  name: string;
  note: string | null;
}

/** Admin-entered; dates and results come only from the official stream. */
export interface Tournament {
  slug: string;
  name: string;
  kind: TournamentKind;
  /** Calendar dates in Vietnam time, "YYYY-MM-DD". */
  startsOn: string | null;
  endsOn: string | null;
  status: TournamentStatus;
  description: string | null;
  videoId: string | null;
  sourceUrl: string | null;
  /** Sorted by rank ascending. */
  results: TournamentResult[];
}
