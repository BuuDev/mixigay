import "server-only";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { serverClient } from "@/server/supabase/server";
import { CONTENT_KINDS, latestSubmissions, mapSubmissions, submissionColumns, type Submission } from "../lib/submissions";

export const MY_SUBMISSIONS_LIMIT = 30;

/**
 * The signed-in fan's latest submissions across every kind. User client: RLS returns
 * their own rows (author_id = auth.uid()). Dynamic (session): render under <Suspense>.
 * Never selects who moderated.
 */
export async function getMySubmissions(userId: string, limit = MY_SUBMISSIONS_LIMIT): Promise<Submission[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await serverClient();
  const lists = await Promise.all(
    CONTENT_KINDS.map(async (kind) => {
      const { data, error } = await supabase
        .from(kind.table)
        .select(submissionColumns(kind, "author"))
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        console.error("getMySubmissions", kind.table, error.message);
        return [];
      }
      return mapSubmissions(kind, (data ?? []) as unknown as Record<string, unknown>[], "author");
    }),
  );
  return latestSubmissions(lists, limit);
}
