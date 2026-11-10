import type { Poll, PollOption, PollStatus } from "../types";

export interface PollOptionRow {
  id: string;
  label: string;
  position: number;
  votes: number;
  suggestion_id: string | null;
}

export interface PollRow {
  id: string;
  question: string;
  status: string;
  closes_at: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  poll_options?: PollOptionRow[] | null;
}

/** Columns + embed for a poll with its options. The hint is required: poll_votes also links polls to poll_options. */
export const POLL_SELECT =
  "id,question,status,closes_at,opened_at,closed_at,created_at,poll_options!poll_options_poll_id_fkey(id,label,position,votes,suggestion_id)";

const STATUSES: PollStatus[] = ["draft", "open", "closed"];

function mapOption(r: PollOptionRow): PollOption | null {
  if (!r || typeof r.id !== "string" || typeof r.label !== "string") return null;
  return {
    id: r.id,
    label: r.label,
    position: Number.isFinite(r.position) ? r.position : 0,
    votes: Number.isFinite(r.votes) && r.votes > 0 ? Math.floor(r.votes) : 0,
    suggestionId: typeof r.suggestion_id === "string" ? r.suggestion_id : null,
  };
}

/** Null for a malformed row or a poll with fewer than two options (nothing to vote on). */
export function mapPoll(r: PollRow): Poll | null {
  if (!r || typeof r.id !== "string" || typeof r.question !== "string") return null;
  const status = STATUSES.find((s) => s === r.status);
  if (!status) return null;
  const options = (Array.isArray(r.poll_options) ? r.poll_options : [])
    .map(mapOption)
    .filter((o): o is PollOption => o !== null)
    .sort((a, b) => a.position - b.position);
  if (options.length < 2) return null;
  return {
    id: r.id,
    question: r.question,
    status,
    closesAt: r.closes_at ?? null,
    openedAt: r.opened_at ?? null,
    closedAt: r.closed_at ?? null,
    createdAt: r.created_at,
    options,
  };
}
