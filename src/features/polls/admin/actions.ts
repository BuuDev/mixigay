"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail, str } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";
import { parseOptionLines, vnLocalToIso } from "../lib/results";

// Admin actions for /admin/binh-chon. adminDb() re-checks admin rights; RLS
// (is_admin()) and the column grants enforce the same in Postgres.

const Question = z.string().trim().min(5, "Câu hỏi ít nhất 5 ký tự").max(140, "Câu hỏi tối đa 140 ký tự");
const Label = z.string().min(1).max(80, "Mỗi lựa chọn tối đa 80 ký tự");

/** Empty → null (no deadline); otherwise a Vietnam-time datetime-local value. */
function closesAt(fd: FormData): string | null {
  const raw = str(fd, "closes_at");
  if (!raw) return null;
  const iso = vnLocalToIso(raw);
  if (!iso) throw new Error("Thời điểm đóng không hợp lệ");
  return iso;
}

export async function createPoll(fd: FormData) {
  const input = z
    .object({
      question: Question,
      options: z.array(Label).min(2, "Cần ít nhất 2 lựa chọn").max(8, "Tối đa 8 lựa chọn"),
      closes_at: z.string().nullable(),
    })
    .parse({ question: str(fd, "question"), options: parseOptionLines(str(fd, "options")), closes_at: closesAt(fd) });
  const supabase = await adminDb();
  const { data, error } = await supabase.from("polls").insert({ question: input.question, closes_at: input.closes_at }).select("id").single();
  fail("createPoll", error);
  const pollId = data!.id as string;
  const { error: optError } = await supabase.from("poll_options").insert(input.options.map((label, position) => ({ poll_id: pollId, label, position })));
  if (optError) await supabase.from("polls").delete().eq("id", pollId);
  fail("createPoll options", optError);
  updateTag(TAGS.polls);
}

export async function createPollFromSuggestions(fd: FormData) {
  const input = z
    .object({ question: Question, limit: z.coerce.number().int().min(2).max(8) })
    .parse({ question: str(fd, "question"), limit: str(fd, "limit") || "4" });
  const supabase = await adminDb();
  const { error } = await supabase.rpc("create_poll_from_suggestions", { p_question: input.question, p_limit: input.limit });
  if (error?.message.includes("not_enough_suggestions")) throw new Error("Cần ít nhất 2 đề xuất đã duyệt, chưa chơi để tạo bình chọn.");
  fail("createPollFromSuggestions", error);
  updateTag(TAGS.polls);
}

const Status = z.enum(["open", "closed"]);

/** Open a draft (or reopen a closed poll), or close an open one. */
export async function setPollStatus(id: string, status: string) {
  const input = z.object({ id: z.uuid(), status: Status }).parse({ id, status });
  const supabase = await adminDb();
  fail("setPollStatus", (await supabase.from("polls").update({ status: input.status }).eq("id", input.id)).error);
  updateTag(TAGS.polls);
}

export async function setPollClosesAt(id: string, fd: FormData) {
  const pollId = z.uuid().parse(id);
  const supabase = await adminDb();
  fail(
    "setPollClosesAt",
    (
      await supabase
        .from("polls")
        .update({ closes_at: closesAt(fd) })
        .eq("id", pollId)
    ).error,
  );
  updateTag(TAGS.polls);
}

/** Only drafts can be deleted: a poll fans voted in is closed, not erased. */
export async function deleteDraftPoll(id: string) {
  const supabase = await adminDb();
  fail("deleteDraftPoll", (await supabase.from("polls").delete().eq("id", z.uuid().parse(id)).eq("status", "draft")).error);
  updateTag(TAGS.polls);
}

/** Edit a draft's question and options (replaces the options; drafts have no votes). */
export async function updateDraftPoll(id: string, fd: FormData) {
  const pollId = z.uuid().parse(id);
  const question = Question.parse(str(fd, "question"));
  const options = z
    .array(Label)
    .min(2, "Cần ít nhất 2 lựa chọn")
    .max(8, "Tối đa 8 lựa chọn")
    .parse(parseOptionLines(str(fd, "options")));
  const supabase = await adminDb();
  const { data: poll } = await supabase.from("polls").select("status").eq("id", pollId).maybeSingle();
  if (poll?.status !== "draft") throw new Error("Chỉ sửa được bình chọn nháp");
  fail("updateDraftPoll", (await supabase.from("polls").update({ question }).eq("id", pollId)).error);
  // Keep options that still match (their suggestion link survives), replace the rest.
  const { data: existing } = await supabase.from("poll_options").select("id,label").eq("poll_id", pollId);
  const keep = new Map((existing ?? []).map((o) => [String(o.label).toLocaleLowerCase("vi"), o.id as string]));
  const wanted = new Set(options.map((l) => l.toLocaleLowerCase("vi")));
  const drop = (existing ?? []).filter((o) => !wanted.has(String(o.label).toLocaleLowerCase("vi"))).map((o) => o.id as string);
  if (drop.length) fail("updateDraftPoll drop", (await supabase.from("poll_options").delete().in("id", drop)).error);
  for (const [position, label] of options.entries()) {
    const keptId = keep.get(label.toLocaleLowerCase("vi"));
    const { error } = keptId
      ? await supabase.from("poll_options").update({ label, position }).eq("id", keptId)
      : await supabase.from("poll_options").insert({ poll_id: pollId, label, position });
    fail("updateDraftPoll option", error);
  }
  updateTag(TAGS.polls);
}
