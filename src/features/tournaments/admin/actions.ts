"use server";

import { updateTag } from "next/cache";
import { adminDb, fail, optional, str } from "@/features/admin/server/admin-db";
import { TAGS } from "@/shared/lib/cache-tags";
import { resultInput, tournamentInput, tournamentSlug } from "../lib/schema";

const fields = (fd: FormData) => ({
  slug: str(fd, "slug"),
  name: str(fd, "name"),
  kind: str(fd, "kind"),
  status: str(fd, "status"),
  starts_on: str(fd, "starts_on"),
  ends_on: str(fd, "ends_on"),
  description: str(fd, "description"),
  video_id: str(fd, "video_id"),
  source_url: str(fd, "source_url"),
});

/** Creates a tournament, or updates the one named by the hidden `original` slug (a slug change cascades to results). */
export async function saveTournament(fd: FormData) {
  const input = tournamentInput.parse(fields(fd));
  const original = optional(fd, "original");
  const supabase = await adminDb();
  if (original) {
    fail("updateTournament", (await supabase.from("tournaments").update(input).eq("slug", tournamentSlug.parse(original))).error);
  } else {
    fail("createTournament", (await supabase.from("tournaments").insert(input)).error);
  }
  updateTag(TAGS.tournaments);
}

export async function deleteTournament(slug: string) {
  const supabase = await adminDb();
  fail("deleteTournament", (await supabase.from("tournaments").delete().eq("slug", tournamentSlug.parse(slug))).error);
  updateTag(TAGS.tournaments);
}

/** Adds a result row, or overwrites the row with the same rank. */
export async function saveResult(fd: FormData) {
  const input = resultInput.parse({ tournament_slug: str(fd, "tournament"), rank: str(fd, "rank"), name: str(fd, "name"), note: str(fd, "note") });
  const supabase = await adminDb();
  fail("saveResult", (await supabase.from("tournament_results").upsert(input, { onConflict: "tournament_slug,rank" })).error);
  updateTag(TAGS.tournaments);
}

export async function deleteResult(slug: string, rank: number) {
  const { tournament_slug, rank: r } = resultInput.pick({ tournament_slug: true, rank: true }).parse({ tournament_slug: slug, rank });
  const supabase = await adminDb();
  fail("deleteResult", (await supabase.from("tournament_results").delete().eq("tournament_slug", tournament_slug).eq("rank", r)).error);
  updateTag(TAGS.tournaments);
}
