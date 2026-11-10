import type { Poll, PollOption } from "../types";

export const totalVotes = (options: Pick<PollOption, "votes">[]) => options.reduce((sum, o) => sum + Math.max(0, o.votes), 0);

/**
 * Whole-number percentages that always add up to 100 (largest remainder method), so
 * "33 / 33 / 33" never shows for three equal options. All zeros when nobody voted.
 * Ties in the remainder go to the earlier option, which keeps the result stable.
 */
export function votePercents(votes: number[]): number[] {
  const clean = votes.map((v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0));
  const total = clean.reduce((a, b) => a + b, 0);
  if (total === 0) return clean.map(() => 0);
  const exact = clean.map((v) => (v * 100) / total);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, rest: x - floors[i] })).sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i]++;
    left--;
  }
  return floors;
}

/** Ids of the options with the most votes (several on a tie); empty when nobody voted. */
export function leaderIds(options: Pick<PollOption, "id" | "votes">[]): string[] {
  const top = Math.max(0, ...options.map((o) => o.votes));
  if (top <= 0) return [];
  return options.filter((o) => o.votes === top).map((o) => o.id);
}

/** Accepts votes now: status open and not past closes_at. */
export function isPollOpen(poll: Pick<Poll, "status" | "closesAt">, now: Date): boolean {
  if (poll.status !== "open") return false;
  return !poll.closesAt || new Date(poll.closesAt).getTime() > now.getTime();
}

/**
 * "Còn 2 ngày 3 giờ", "Còn 45 phút", "Sắp đóng", "Đã đóng"; null when the poll has no
 * deadline. Rounds down, so it never promises more time than is left.
 */
export function timeLeftLabel(closesAt: string | null, now: Date): string | null {
  if (!closesAt) return null;
  const ms = new Date(closesAt).getTime() - now.getTime();
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return "Đã đóng";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "Sắp đóng";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return hours > 0 ? `Còn ${days} ngày ${hours} giờ` : `Còn ${days} ngày`;
  if (hours > 0) return mins > 0 ? `Còn ${hours} giờ ${mins} phút` : `Còn ${hours} giờ`;
  return `Còn ${mins} phút`;
}

/** Counts after the viewer moves their vote from `from` to `to` (either may be null). */
export function moveVote<T extends Pick<PollOption, "id" | "votes">>(options: T[], from: string | null, to: string | null): T[] {
  if (from === to) return options;
  return options.map((o) => {
    if (o.id === from) return { ...o, votes: Math.max(0, o.votes - 1) };
    if (o.id === to) return { ...o, votes: o.votes + 1 };
    return o;
  });
}

/** The poll to feature: the open one, else the latest result. */
export const featuredPoll = (board: { current: Poll | null; previous: Poll | null }): Poll | null => board.current ?? board.previous;

const VN_OFFSET_MS = 7 * 3600_000;

/** "2026-11-10T21:30" typed as Vietnam time (UTC+7, no DST) → UTC ISO; null if invalid. */
export function vnLocalToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const utc = Date.UTC(y, mo - 1, d, h, mi) - VN_OFFSET_MS;
  const check = new Date(utc + VN_OFFSET_MS);
  if (check.getUTCDate() !== d || check.getUTCMonth() !== mo - 1) return null; // 31/02 etc.
  return new Date(utc).toISOString();
}

/** UTC ISO → "YYYY-MM-DDTHH:mm" in Vietnam time, for a datetime-local input. */
export function isoToVnLocal(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  return new Date(t + VN_OFFSET_MS).toISOString().slice(0, 16);
}

/** Admin textarea → option labels: one per line, trimmed, blanks and duplicates dropped. */
export function parseOptionLines(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const label = line.trim().replace(/\s+/g, " ");
    const key = label.toLocaleLowerCase("vi");
    if (!label || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

/** "10/11 21:30" in Vietnam time, for admin lists. */
export function formatVnDateTime(iso: string): string {
  const local = isoToVnLocal(iso);
  if (!local) return "";
  return `${local.slice(8, 10)}/${local.slice(5, 7)} ${local.slice(11, 16)}`;
}
