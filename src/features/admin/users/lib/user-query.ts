import { z } from "zod";

export const USER_PAGE = 50;
export const USER_SUBMISSIONS = 50;

export type TrustFilter = "banned" | "shadow";
export const TRUST_VALUE: Record<TrustFilter, number> = { banned: -1, shadow: -2 };

export interface UserQuery {
  q: string;
  trust: TrustFilter | null;
  /** Detail view for one account. */
  id: string | null;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseUserQuery(params: Params): UserQuery {
  const trust = one(params.trust);
  const id = one(params.id);
  return {
    q: one(params.q).trim().slice(0, 60),
    trust: trust === "banned" || trust === "shadow" ? trust : null,
    id: z.uuid().safeParse(id).success ? id.toLowerCase() : null,
  };
}

/** A literal ilike pattern "contains q": %, _ and \ in the input match themselves. */
export function ilikeContains(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export function trustLabel(trust: number): { label: string; tone: "danger" | "misc" | "cleared" } | null {
  if (trust === -1) return { label: "Bị cấm", tone: "danger" };
  if (trust === -2) return { label: "Cấm ngầm", tone: "misc" };
  if (trust > 0) return { label: "Tin cậy", tone: "cleared" };
  return null;
}

export interface Counts {
  pending: number;
  approved: number;
  rejected: number;
}

/** Tally submissions per author (rows: author_id, approved, rejected_at). */
export function tallyCounts(rows: { author_id: string; approved: boolean | null; rejected_at: string | null }[]): Map<string, Counts> {
  const out = new Map<string, Counts>();
  for (const r of rows) {
    const c = out.get(r.author_id) ?? { pending: 0, approved: 0, rejected: 0 };
    if (r.rejected_at) c.rejected++;
    else if (r.approved) c.approved++;
    else c.pending++;
    out.set(r.author_id, c);
  }
  return out;
}

export const REPORT_REASON: Record<string, string> = {
  spam: "Spam",
  gambling: "Cờ bạc",
  offensive: "Xúc phạm",
  impersonation: "Mạo danh",
  other: "Khác",
};
