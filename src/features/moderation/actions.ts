"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { moderateUser } from "@/features/admin/moderation-actions";
import { adminDb, fail, str } from "@/features/admin/server/admin-db";
import { mirrorSteamArt } from "@/features/suggestions/server/game-art";
import { adminClient } from "@/server/supabase/admin";
import { CONTENT_KINDS, KIND_IDS, type ContentKind } from "./lib/kinds";
import { approveErrorMessage, composeReason, groupRefs, parseItemRef, REASON_MAX, type ItemRef } from "./lib/review";

// Approve / reject from the shared inbox (/admin/duyet). Rejecting keeps the row (the
// author's daily quota is not refunded); DB triggers write public.moderation_log.

const Kind = z.enum(KIND_IDS);
const Ref = z.object({ kind: Kind, id: z.uuid() });
const Refs = z.array(Ref).min(1).max(300);
const Reason = z.string().trim().min(1).max(REASON_MAX);

type Db = Awaited<ReturnType<typeof adminDb>>;

function throwFriendly(kind: ContentKind, what: string, error: { code?: string; message: string } | null) {
  const friendly = error && approveErrorMessage(kind, error);
  if (friendly) throw new Error(friendly);
  fail(what, error);
}

/** Approving a Steam suggestion without stored art copies the header now (same as /admin/de-xuat). */
async function mirrorArt(db: Db, ids: string[]) {
  const { data } = await db.from("suggestions").select("id,steam_app_id,thumbnail_path").in("id", ids);
  for (const row of (data ?? []) as { id: string; steam_app_id: number | null; thumbnail_path: string | null }[]) {
    if (!row.steam_app_id || row.thumbnail_path) continue;
    const result = await mirrorSteamArt(adminClient(), row.id);
    if ("skipped" in result) console.warn("approve mirrorSteamArt", row.id, result.skipped);
  }
}

async function approve(db: Db, kind: ContentKind, ids: string[]) {
  const { error } = await db.from(CONTENT_KINDS[kind].table).update({ approved: true }).in("id", ids);
  throwFriendly(kind, `approve ${kind}`, error);
  if (kind === "suggestion") await mirrorArt(db, ids);
}

async function reject(db: Db, kind: ContentKind, ids: string[], reason: string) {
  const { error } = await db.from(CONTENT_KINDS[kind].table).update({ rejected_at: new Date().toISOString(), rejected_reason: reason }).in("id", ids);
  fail(`reject ${kind}`, error);
}

const reasonFrom = (fd: FormData) => Reason.parse(composeReason(str(fd, "preset"), str(fd, "note")));

export async function approveItem(kind: ContentKind, id: string) {
  const ref = Ref.parse({ kind, id });
  const db = await adminDb();
  await approve(db, ref.kind, [ref.id]);
  updateTag(CONTENT_KINDS[ref.kind].cacheTag);
}

export async function rejectItem(kind: ContentKind, id: string, formData: FormData) {
  const ref = Ref.parse({ kind, id });
  const reason = reasonFrom(formData);
  const db = await adminDb();
  await reject(db, ref.kind, [ref.id], reason);
  updateTag(CONTENT_KINDS[ref.kind].cacheTag);
}

/**
 * One statement per kind. If a banned author's row makes the whole statement fail, the
 * rows of that kind are retried one by one so the rest still go through.
 */
export async function approveMany(items: ItemRef[]) {
  const refs = Refs.parse(items);
  const db = await adminDb();
  const refused: string[] = [];
  for (const [kind, ids] of groupRefs(refs)) {
    try {
      await approve(db, kind, ids);
    } catch {
      for (const id of ids) {
        try {
          await approve(db, kind, [id]);
        } catch (e) {
          refused.push(e instanceof Error ? e.message : String(e));
        }
      }
    }
    updateTag(CONTENT_KINDS[kind].cacheTag);
  }
  if (refused.length) throw new Error(`${refused.length} mục không duyệt được: ${[...new Set(refused)].join(" ")}`);
}

export async function rejectMany(items: ItemRef[], reason: string) {
  const refs = Refs.parse(items);
  const text = Reason.parse(reason);
  const db = await adminDb();
  for (const [kind, ids] of groupRefs(refs)) {
    await reject(db, kind, ids, text);
    updateTag(CONTENT_KINDS[kind].cacheTag);
  }
}

const selected = (fd: FormData): ItemRef[] =>
  fd
    .getAll("item")
    .map(parseItemRef)
    .filter((r): r is ItemRef => r !== null);

/** Bulk form: checked "kind:id" boxes → approve. */
export async function approveSelected(formData: FormData) {
  const refs = selected(formData);
  if (!refs.length) throw new Error("Chưa chọn mục nào.");
  await approveMany(refs);
}

/** Bulk form: checked boxes + one reason → reject. */
export async function rejectSelected(formData: FormData) {
  const refs = selected(formData);
  if (!refs.length) throw new Error("Chưa chọn mục nào.");
  await rejectMany(refs, reasonFrom(formData));
}

/** Rejects the item, then bans its author (hides everything they posted, see moderate_user()). */
export async function banAuthorAndReject(kind: ContentKind, id: string, authorId: string) {
  const ref = Ref.parse({ kind, id });
  const author = z.uuid().parse(authorId);
  const db = await adminDb();
  const { data, error } = await db.from(CONTENT_KINDS[ref.kind].table).select("author_id").eq("id", ref.id).maybeSingle();
  fail("banAuthorAndReject", error);
  if ((data as { author_id?: string } | null)?.author_id !== author) throw new Error("Tác giả không khớp với mục này: tải lại trang rồi thử lại.");
  await reject(db, ref.kind, [ref.id], "Tác giả bị cấm");
  updateTag(CONTENT_KINDS[ref.kind].cacheTag);
  await moderateUser(author, "ban");
}
