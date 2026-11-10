"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import type { PollActionResult } from "./types";

// Fan voting on "Bình chọn của Bộ Tộc". Postgres is the gate (RLS on poll_votes:
// open poll, account ≥ 24 h, not banned; trigger: 60 writes/hour, shadow bans
// dropped, counts kept). These actions only add friendly Vietnamese errors.

const SIGN_IN = "Vào Bộ Tộc (đăng nhập) để bình chọn.";
const NEW_ACCOUNT = "Tài khoản mới cần 24 giờ trước khi bình chọn (chống clone).";
const CLOSED = "Bình chọn này đã đóng rồi.";
const TOO_FAST = "Bạn bấm nhanh quá, nghỉ tay một lát rồi bình chọn tiếp nhé.";
const GENERIC = "Có lỗi, thử lại sau.";

const Ids = z.object({ pollId: z.uuid(), optionId: z.uuid() });

type Db = Awaited<ReturnType<typeof serverClient>>;

function voteError(error: { code?: string; message: string }): PollActionResult {
  if (error.message.includes("rate_limited")) return { ok: false, message: TOO_FAST };
  // RLS refusal once the poll is known to be open: new (or banned) account. A ban is never named.
  if (error.code === "42501") return { ok: false, message: NEW_ACCOUNT };
  if (error.code === "23503") return { ok: false, message: "Lựa chọn này không thuộc bình chọn, tải lại trang nhé." };
  console.error("poll vote", error);
  return { ok: false, message: GENERIC };
}

async function ensureOpen(supabase: Db, pollId: string): Promise<PollActionResult | null> {
  const { data, error } = await supabase.rpc("poll_is_open", { p_poll: pollId });
  if (error) {
    console.error("poll_is_open", error);
    return { ok: false, message: GENERIC };
  }
  return data === true ? null : { ok: false, message: CLOSED };
}

/** Insert or move the viewer's one vote in the poll. */
async function writeVote(pollId: string, optionId: string): Promise<PollActionResult> {
  const parsed = Ids.safeParse({ pollId, optionId });
  if (!parsed.success) return { ok: false, message: GENERIC };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SIGN_IN };
  const supabase = await serverClient();
  const closed = await ensureOpen(supabase, parsed.data.pollId);
  if (closed) return closed;

  const key = { poll_id: parsed.data.pollId, user_id: viewer.id };
  const { data: existing } = await supabase.from("poll_votes").select("option_id").match(key).maybeSingle();
  if (existing?.option_id === parsed.data.optionId) return { ok: true };
  const { error } = existing
    ? await supabase.from("poll_votes").update({ option_id: parsed.data.optionId }).match(key)
    : await supabase.from("poll_votes").insert({ poll_id: parsed.data.pollId, option_id: parsed.data.optionId });
  if (error) return voteError(error);
  // Stale-while-revalidate, like suggestion votes: vote spam must not keep emptying the
  // shared cache. The voter sees their vote optimistically; others get it via Realtime.
  revalidateTag(TAGS.polls, "max");
  return { ok: true };
}

/** First vote in a poll. */
export async function votePoll(pollId: string, optionId: string): Promise<PollActionResult> {
  return writeVote(pollId, optionId);
}

/** Move the viewer's vote to another option (same poll, still open). */
export async function changePollVote(pollId: string, optionId: string): Promise<PollActionResult> {
  return writeVote(pollId, optionId);
}

/** Withdraw the viewer's vote while the poll is open. */
export async function unvotePoll(pollId: string): Promise<PollActionResult> {
  if (!z.uuid().safeParse(pollId).success) return { ok: false, message: GENERIC };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SIGN_IN };
  const supabase = await serverClient();
  const closed = await ensureOpen(supabase, pollId);
  if (closed) return closed;
  const { error } = await supabase.from("poll_votes").delete().match({ poll_id: pollId, user_id: viewer.id });
  if (error) return voteError(error);
  revalidateTag(TAGS.polls, "max");
  return { ok: true };
}
