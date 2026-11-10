import type { Suggestion } from "../types";

/**
 * Ranking for the suggestion board and "Ứng viên tối nay".
 *
 * Problem it solves: sorting by all-time upvotes keeps famous old suggestions on top
 * forever, so fan-made and newly suggested games never get seen. anh Độ plays ONE game
 * a night, so what matters is "what does Bộ Tộc want right now".
 *
 * hotScore = (upvotes + 1) / (ageHours + AGE_OFFSET_HOURS) ^ GRAVITY × boosts
 *
 * - GRAVITY 1.4 (Hacker News uses 1.8): votes still count, but a suggestion has to keep
 *   collecting them to stay up. A 30-day-old 500-vote game scores ≈ 0.05; a 2-hour-old
 *   8-vote fan game ≈ 0.47 (with both boosts, ×2.08).
 * - AGE_OFFSET_HOURS 12 (HN uses 2): flattens the first half-day so a brand-new 0-vote
 *   post does not outrank everything just for being new (it scores ≈ 0.04, about the
 *   same as a two-week-old 150-vote game).
 * - Boosts: fan-made (source "viewer-made") ×1.6, fresh (< 72 h) ×1.3; they multiply.
 * - Only "pending" suggestions compete; played/rejected score 0 and sort last.
 * - Ties: newer first, then id (ascending) so the order never flips between renders.
 */
export const GRAVITY = 1.4;
export const AGE_OFFSET_HOURS = 12;
export const FAN_BOOST = 1.6;
export const FRESH_BOOST = 1.3;
export const FRESH_HOURS = 72;

const HOUR_MS = 3_600_000;

export type SortMode = "hot" | "new" | "fan" | "top";
export const SORT_MODES: readonly SortMode[] = ["hot", "new", "fan", "top"];
export const DEFAULT_SORT: SortMode = "hot";

/** Reads `?sort=`; anything unknown falls back to "hot". */
export function parseSortMode(value: string | null | undefined): SortMode {
  return SORT_MODES.includes(value as SortMode) ? (value as SortMode) : DEFAULT_SORT;
}

function createdMs(s: Suggestion): number {
  const t = Date.parse(s.createdAt);
  return Number.isNaN(t) ? 0 : t;
}

/** Hours since the suggestion was created; never negative (clock skew, demo items). */
export function ageHours(s: Suggestion, nowMs: number): number {
  return Math.max(0, (nowMs - createdMs(s)) / HOUR_MS);
}

export function isFresh(s: Suggestion, nowMs: number): boolean {
  return ageHours(s, nowMs) < FRESH_HOURS;
}

export function isFanMade(s: Suggestion): boolean {
  return s.source === "viewer-made";
}

/** Time-decayed popularity; 0 for anything that is not pending. */
export function hotScore(s: Suggestion, nowMs: number): number {
  if (s.status !== "pending") return 0;
  const base = (Math.max(0, s.upvotes) + 1) / Math.pow(ageHours(s, nowMs) + AGE_OFFSET_HOURS, GRAVITY);
  return base * (isFanMade(s) ? FAN_BOOST : 1) * (isFresh(s, nowMs) ? FRESH_BOOST : 1);
}

/** Newer first, then id: the shared deterministic tie-break. */
function tieBreak(a: Suggestion, b: Suggestion): number {
  return createdMs(b) - createdMs(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

const pendingFirst = (a: Suggestion, b: Suggestion) => Number(b.status === "pending") - Number(a.status === "pending");

function byHot(nowMs: number) {
  return (a: Suggestion, b: Suggestion) => pendingFirst(a, b) || hotScore(b, nowMs) - hotScore(a, nowMs) || tieBreak(a, b);
}

const byNew = (a: Suggestion, b: Suggestion) => tieBreak(a, b);
const byTop = (a: Suggestion, b: Suggestion) => b.upvotes - a.upvotes || tieBreak(a, b);

/**
 * Orders suggestions for a board tab (returns a new array):
 * - "hot": pending by hotScore, then played/rejected (newest first);
 * - "new": newest first, any status;
 * - "fan": fan-made only, in hot order;
 * - "top": all-time upvotes.
 */
export function sortSuggestions(items: readonly Suggestion[], mode: SortMode, nowMs: number): Suggestion[] {
  switch (mode) {
    case "new":
      return [...items].sort(byNew);
    case "top":
      return [...items].sort(byTop);
    case "fan":
      return items.filter(isFanMade).sort(byHot(nowMs));
    case "hot":
    default:
      return [...items].sort(byHot(nowMs));
  }
}

/** "Đang lên": within the hot top RISING_WITHIN and at least RISING_GAP places above its all-time rank. */
export const RISING_WITHIN = 10;
export const RISING_GAP = 3;

/** Ids of pending suggestions climbing much faster in "hot" than their all-time votes would place them. */
export function risingIds(items: readonly Suggestion[], nowMs: number): Set<string> {
  const pending = items.filter((s) => s.status === "pending");
  const topRank = new Map(pending.sort(byTop).map((s, i) => [s.id, i]));
  const hot = [...pending].sort(byHot(nowMs));
  const out = new Set<string>();
  hot.slice(0, RISING_WITHIN).forEach((s, hotRank) => {
    if ((topRank.get(s.id) ?? hotRank) - hotRank >= RISING_GAP) out.add(s.id);
  });
  return out;
}

export type LineupReason = "hot" | "new" | "fan";

export const LINEUP_REASON_LABEL: Record<LineupReason, string> = {
  hot: "Đang hot",
  new: "Mới đề xuất",
  fan: "Bộ Tộc tự làm",
};

export interface LineupPick {
  suggestion: Suggestion;
  reason: LineupReason;
  /** Vietnamese chip text for `reason`. */
  label: string;
}

export const LINEUP_SIZE = 5;
const HOT_SLOTS = 3;

/**
 * The 5 candidates for tonight's ONE game, pending suggestions only, no duplicates:
 * 1-3. the top 3 by hotScore ("Đang hot");
 * 4.   the best fresh suggestion (< 72 h) by hotScore, or the newest one when none is fresh ("Mới đề xuất");
 * 5.   the best fan-made game by hotScore ("Bộ Tộc tự làm").
 * A slot with no eligible suggestion (e.g. no fan-made game left) is filled with the next
 * "Đang hot" one, so the lineup is shorter than 5 only when fewer than 5 are pending.
 */
export function tonightLineup(suggestions: readonly Suggestion[], nowMs: number): LineupPick[] {
  const hot = suggestions.filter((s) => s.status === "pending").sort(byHot(nowMs));
  const chosen = new Set<string>();
  const picks: LineupPick[] = [];
  const take = (s: Suggestion | undefined, reason: LineupReason) => {
    if (!s || chosen.has(s.id)) return false;
    chosen.add(s.id);
    picks.push({ suggestion: s, reason, label: LINEUP_REASON_LABEL[reason] });
    return true;
  };
  const free = (s: Suggestion) => !chosen.has(s.id);

  hot.slice(0, HOT_SLOTS).forEach((s) => take(s, "hot"));

  const fresh = hot.find((s) => free(s) && isFresh(s, nowMs));
  const newest = [...hot].sort(byNew).find(free);
  const newPick = fresh ?? newest;

  // A fresh fan game may win the "new" slot; the fan slot then goes to the next fan game.
  take(newPick, "new");
  take(
    hot.find((s) => free(s) && isFanMade(s)),
    "fan",
  );

  // Backfill empty slots from the hot order.
  for (const s of hot) {
    if (picks.length >= LINEUP_SIZE) break;
    take(s, "hot");
  }
  return picks;
}
