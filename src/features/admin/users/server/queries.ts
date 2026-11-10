import "server-only";
import { CONTENT_KINDS, latestSubmissions, mapSubmissions, submissionColumns, type Submission } from "@/features/account/lib/submissions";
import { serverClient } from "@/server/supabase/server";
import { tallyCounts, USER_SUBMISSIONS, type Counts } from "../lib/user-query";

// Reads with the admin's session: RLS (is_admin()) lets admins see every row.

const check = <T>(what: string, r: { data: unknown; error: { message: string } | null }): T => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return (r.data ?? []) as T;
};

/** Pending / approved / rejected per user across the seven tables, for the listed users only. */
export async function getSubmissionCounts(userIds: string[]): Promise<Map<string, Counts>> {
  if (!userIds.length) return new Map();
  const supabase = await serverClient();
  const lists = await Promise.all(
    CONTENT_KINDS.map(async (k) =>
      check<{ author_id: string; approved: boolean | null; rejected_at: string | null }[]>(
        k.table,
        await supabase.from(k.table).select("author_id,approved,rejected_at").in("author_id", userIds).limit(10_000),
      ),
    ),
  );
  return tallyCounts(lists.flat());
}

/** Open reports against each user's account (target_kind 'profile'). */
export async function getOpenProfileReports(userIds: string[]): Promise<Map<string, number>> {
  if (!userIds.length) return new Map();
  const supabase = await serverClient();
  const rows = check<{ target_id: string }[]>(
    "reports",
    await supabase.from("reports").select("target_id").eq("target_kind", "profile").eq("resolved", false).in("target_id", userIds),
  );
  const out = new Map<string, number>();
  for (const r of rows) out.set(r.target_id, (out.get(r.target_id) ?? 0) + 1);
  return out;
}

export async function getUserSubmissions(userId: string): Promise<Submission[]> {
  const supabase = await serverClient();
  const lists = await Promise.all(
    CONTENT_KINDS.map(async (k) =>
      mapSubmissions(
        k,
        check<Record<string, unknown>[]>(
          k.table,
          await supabase
            .from(k.table)
            .select(submissionColumns(k, "admin"))
            .eq("author_id", userId)
            .order("created_at", { ascending: false })
            .limit(USER_SUBMISSIONS),
        ),
        "admin",
      ),
    ),
  );
  return latestSubmissions(lists, USER_SUBMISSIONS);
}

export interface UserLogRow {
  id: number;
  kind: string;
  action: string;
  actor_id: string | null;
  reason: string | null;
  snapshot: string | null;
  created_at: string;
}

/** Moderation decisions about this user's content or account, newest first. */
export async function getUserLog(userId: string): Promise<UserLogRow[]> {
  const supabase = await serverClient();
  return check<UserLogRow[]>(
    "moderation_log",
    await supabase
      .from("moderation_log")
      .select("id,kind,action,actor_id,reason,snapshot,created_at")
      .eq("author_id", userId)
      .order("id", { ascending: false })
      .limit(100),
  );
}

export interface ReportRow {
  id: string;
  reason: string;
  note: string | null;
  resolved: boolean;
  created_at: string;
}

export async function getProfileReports(userId: string): Promise<ReportRow[]> {
  const supabase = await serverClient();
  return check<ReportRow[]>(
    "reports",
    await supabase
      .from("reports")
      .select("id,reason,note,resolved,created_at")
      .eq("target_kind", "profile")
      .eq("target_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  );
}
