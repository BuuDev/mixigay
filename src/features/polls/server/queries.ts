import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getViewer } from "@/features/auth/server/viewer";
import { publicClient } from "@/server/supabase/public";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapPoll, POLL_SELECT, type PollRow } from "../lib/mapper";
import * as mock from "../mock";
import type { Poll, PollBoard, PollViewer } from "../types";

/**
 * The newest open poll and the newest closed one, with counts (RLS hides drafts from
 * the anon client). Counts may be a few minutes old: the card refreshes them through
 * Realtime. A failed read hides the card instead of breaking the home page.
 */
export async function getPollBoard(): Promise<PollBoard> {
  "use cache";
  cacheTag(TAGS.polls);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return mock.board;
  const db = publicClient();
  const [open, closed] = await Promise.all([
    db.from("polls").select(POLL_SELECT).eq("status", "open").order("created_at", { ascending: false }).limit(1),
    db.from("polls").select(POLL_SELECT).eq("status", "closed").order("closed_at", { ascending: false, nullsFirst: false }).limit(1),
  ]);
  if (open.error) console.error("polls open", open.error.message);
  if (closed.error) console.error("polls closed", closed.error.message);
  const first = (rows: unknown): Poll | null => {
    const row = Array.isArray(rows) ? (rows[0] as PollRow | undefined) : undefined;
    return row ? mapPoll(row) : null;
  };
  return { current: first(open.data), previous: first(closed.data) };
}

/** The viewer's vote in a poll. Dynamic (session), never cached: render under <Suspense>. */
export async function getMyPollVote(pollId: string): Promise<PollViewer> {
  if (!isSupabaseConfigured) return { signedIn: false, optionId: null };
  const viewer = await getViewer();
  if (!viewer) return { signedIn: false, optionId: null };
  const supabase = await serverClient();
  const { data } = await supabase.from("poll_votes").select("option_id").match({ poll_id: pollId, user_id: viewer.id }).maybeSingle();
  return { signedIn: true, optionId: (data?.option_id as string | undefined) ?? null };
}
