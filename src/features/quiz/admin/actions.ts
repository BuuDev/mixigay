"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str } from "@/features/admin/server/admin-db";
import { isVideoId, resolveMoment } from "@/features/quotes/lib/moment";
import { TAGS } from "@/shared/lib/cache-tags";
import { quizLinkAdminError } from "../lib/errors";

function failFriendly(what: string, error: { code?: string; message: string } | null) {
  const friendly = error && quizLinkAdminError(error);
  if (friendly) throw new Error(friendly);
  fail(what, error);
}

export async function setQuizLinkApproved(id: string, approved: boolean) {
  const supabase = await adminDb();
  // block_banned_approval() refuses approving a banned author's link.
  failFriendly("setQuizLinkApproved", (await supabase.from("quiz_links").update({ approved }).eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.quiz);
}

export async function deleteQuizLink(id: string) {
  const supabase = await adminDb();
  fail("deleteQuizLink", (await supabase.from("quiz_links").delete().eq("id", z.uuid().parse(id))).error);
  updateTag(TAGS.quiz);
}

/**
 * Records where anh Độ played the quiz. `video` is a video id or a YouTube link (its ?t= is used
 * when `time` is empty); `time` is "mm:ss" or "h:mm:ss". The videos FK rejects unknown videos.
 */
export async function markQuizLinkPlayed(id: string, formData: FormData) {
  const supabase = await adminDb();
  const video = str(formData, "video");
  const moment = resolveMoment(isVideoId(video) ? { videoId: video, time: str(formData, "time") } : { link: video, time: str(formData, "time") });
  if (!moment.ok) throw new Error(moment.message);
  const { error } = await supabase
    .from("quiz_links")
    .update({ played_video_id: moment.videoId, played_at_seconds: moment.atSeconds })
    .eq("id", z.uuid().parse(id));
  failFriendly("markQuizLinkPlayed", error);
  updateTag(TAGS.quiz);
}

export async function clearQuizLinkPlayed(id: string) {
  const supabase = await adminDb();
  fail(
    "clearQuizLinkPlayed",
    (await supabase.from("quiz_links").update({ played_video_id: null, played_at_seconds: null }).eq("id", z.uuid().parse(id))).error,
  );
  updateTag(TAGS.quiz);
}
