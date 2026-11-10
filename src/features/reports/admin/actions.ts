"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminDb, fail } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";
import { REPORT_KINDS } from "../lib/reasons";

const Target = z.object({ kind: z.enum(REPORT_KINDS), id: z.uuid() });

/** Marks every open report on one target as handled (content kept). */
export async function resolveReports(kind: string, id: string) {
  const t = Target.parse({ kind, id });
  const supabase = await adminDb();
  fail("resolveReports", (await supabase.from("reports").update({ resolved: true }).match({ target_kind: t.kind, target_id: t.id, resolved: false })).error);
}

/** Takes the reported content down (suggestion hidden, song unpublished, name reset), then resolves its reports. */
export async function takeDown(kind: string, id: string) {
  const t = Target.parse({ kind, id });
  const supabase = await adminDb();
  if (t.kind === "suggestion") {
    fail("takeDown", (await supabase.from("suggestions").update({ hidden: true }).eq("id", t.id)).error);
    updateTag(TAGS.suggestions);
  } else if (t.kind === "quote") {
    fail("takeDown", (await supabase.from("quotes").update({ approved: false }).eq("id", t.id)).error);
    updateTag(TAGS.quotes);
  } else if (t.kind === "quiz_link") {
    fail("takeDown", (await supabase.from("quiz_links").update({ approved: false }).eq("id", t.id)).error);
    updateTag(TAGS.quiz);
  } else if (t.kind === "glossary_entry") {
    fail("takeDown", (await supabase.from("glossary_entries").update({ approved: false }).eq("id", t.id)).error);
    updateTag(TAGS.glossary);
  } else if (t.kind === "wall_message") {
    fail("takeDown", (await supabase.from("wall_messages").update({ approved: false }).eq("id", t.id)).error);
    updateTag(TAGS.wall);
  } else if (t.kind === "fan_song") {
    fail("takeDown", (await supabase.from("fan_songs").update({ approved: false }).eq("id", t.id)).error);
    updateTag(TAGS.songs);
  } else {
    fail("takeDown", (await supabase.rpc("reset_display_name", { p_user: t.id })).error);
    updateTag(TAGS.suggestions);
    updateTag(TAGS.songs);
  }
  await resolveReports(t.kind, t.id);
}
