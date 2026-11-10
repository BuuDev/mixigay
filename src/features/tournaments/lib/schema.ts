import { z } from "zod";
import { TOURNAMENT_KINDS, TOURNAMENT_STATUSES } from "../types";

export const tournamentSlug = z.string().regex(/^[a-z0-9-]{3,60}$/, "slug 3–60 ký tự, chỉ gồm a-z, 0-9, dấu gạch");

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Accepts a bare 11-char video id or a youtube.com/watch, youtu.be or /live/ URL; returns the id or null. */
export function parseVideoId(input: string): string | null {
  const s = input.trim();
  if (VIDEO_ID.test(s)) return s;
  const m = /(?:[?&]v=|youtu\.be\/|\/live\/|\/shorts\/)([A-Za-z0-9_-]{11})(?:[?&#/]|$)/.exec(s);
  return m ? m[1] : null;
}

const date = z.iso.date().nullable();
const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Mirrors the checks on public.tournaments (supabase/migrations/20261110140000_community_content.sql). */
export const tournamentInput = z
  .object({
    slug: tournamentSlug,
    name: z.string().trim().min(2).max(120),
    kind: z.enum(TOURNAMENT_KINDS),
    status: z.enum(TOURNAMENT_STATUSES),
    starts_on: z.preprocess(blankToNull, date),
    ends_on: z.preprocess(blankToNull, date),
    description: z.preprocess(blankToNull, z.string().trim().max(600).nullable()),
    video_id: z.preprocess(blankToNull, z.string().nullable()).transform((v, ctx) => {
      if (v === null) return null;
      const id = parseVideoId(v);
      if (!id) ctx.addIssue({ code: "custom", message: "video không hợp lệ (ID 11 ký tự hoặc link YouTube)" });
      return id;
    }),
    source_url: z.preprocess(
      blankToNull,
      z
        .url({ protocol: /^https$/ })
        .max(500)
        .nullable(),
    ),
  })
  .refine((t) => !t.starts_on || !t.ends_on || t.ends_on >= t.starts_on, { message: "ngày kết thúc phải sau ngày bắt đầu", path: ["ends_on"] });

export const resultInput = z.object({
  tournament_slug: tournamentSlug,
  rank: z.coerce.number().int().min(1).max(64),
  name: z.string().trim().min(1).max(120),
  note: z.preprocess(blankToNull, z.string().trim().max(200).nullable()),
});
