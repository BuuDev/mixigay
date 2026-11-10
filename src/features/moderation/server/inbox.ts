import "server-only";
import { cache } from "react";
import { adminDb } from "@/features/admin/server/admin-db";
import { screenText, type Flag } from "@/shared/lib/moderation/screen";
import { CONTENT_KINDS, KIND_IDS, KIND_LIST, screenFields, toInboxItem, type ContentKind, type InboxItem, type KindDef, type Row } from "../lib/kinds";
import { INBOX_LIMIT_MAX, INBOX_STEP } from "../lib/review";

// Admin-only reads for /admin/duyet. The admin's own session (RLS lets is_admin() read
// pending rows); never cached: counts and queues are per-request admin data.

type Db = Awaited<ReturnType<typeof adminDb>>;

export interface InboxAuthor {
  id: string;
  displayName: string;
  createdAt?: string;
  /** −1 banned, −2 shadow-banned, 0 normal; undefined when the session may not read it. */
  trust?: number;
  rejectedCount: number;
  pendingCount: number;
}

export interface InboxEntry extends InboxItem {
  author: InboxAuthor;
  flags: Flag[];
}

export type PendingCounts = Record<ContentKind, number> & { reports: number };

/** Pending = not approved, not rejected (suggestions: not hidden either). */
function pending(db: Db, def: KindDef, columns: string, head = false) {
  let q = db
    .from(def.table)
    .select(columns, head ? { count: "exact", head: true } : undefined)
    .eq("approved", false)
    .is("rejected_at", null);
  if (def.hiddenColumn) q = q.eq("hidden", false);
  return q;
}

/** Deduped per request (the admin nav and the inbox both show the counts). */
export const getPendingCounts = cache(async (): Promise<PendingCounts> => {
  const db = await adminDb();
  const [reports, ...counts] = await Promise.all([
    db.from("reports").select("id", { count: "exact", head: true }).eq("resolved", false),
    ...KIND_LIST.map((def) => pending(db, def, "id", true)),
  ]);
  const out = { reports: reports.count ?? 0 } as PendingCounts;
  KIND_IDS.forEach((k, i) => (out[k] = counts[i].count ?? 0));
  return out;
});

export const totalPending = (c: PendingCounts) => KIND_IDS.reduce((sum, k) => sum + c[k], 0);

/** Newest-first pending items across kinds (or one kind), each with its author's record and screen flags. */
export async function getInbox({ kind, limit = INBOX_STEP }: { kind?: ContentKind; limit?: number } = {}): Promise<{
  items: InboxEntry[];
  hasMore: boolean;
  now: number;
}> {
  const db = await adminDb();
  const n = Math.min(Math.max(1, Math.floor(limit)), INBOX_LIMIT_MAX);
  const defs = kind ? [CONTENT_KINDS[kind]] : KIND_LIST;
  const results = await Promise.all(
    defs.map((def) =>
      pending(db, def, def.select)
        .order("created_at", { ascending: false })
        .limit(n + 1),
    ),
  );
  const items: InboxItem[] = [];
  results.forEach((res, i) => {
    if (res.error) throw new Error(`getInbox ${defs[i].table}: ${res.error.message}`);
    for (const row of (res.data ?? []) as unknown as Row[]) {
      const item = toInboxItem(defs[i].kind, row);
      if (item) items.push(item);
    }
  });
  items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const page = items.slice(0, n);
  const authors = await getAuthors(db, [...new Set(page.map((i) => i.authorId))]);
  return {
    // Read after the request-bound queries; the page formats account ages against it.
    now: Date.now(),
    hasMore: items.length > n,
    items: page.map((item) => ({
      ...item,
      author: authors.get(item.authorId) ?? { id: item.authorId, displayName: "Fan", rejectedCount: 0, pendingCount: 0 },
      flags: screenText(screenFields(item)).flags,
    })),
  };
}

/** Name, account age, trust and track record (rejected / pending rows across every kind) for each author. */
async function getAuthors(db: Db, ids: string[]): Promise<Map<string, InboxAuthor>> {
  const out = new Map<string, InboxAuthor>();
  if (!ids.length) return out;
  const [profiles, trust, ...history] = await Promise.all([
    db.from("profiles").select("id,display_name,created_at").in("id", ids),
    // trust has no column grant (a shadow ban stays invisible to its target): admins read it
    // through the admin-only public.admin_profiles (migration 20261110210000).
    db.rpc("admin_profiles", { p_ids: ids, p_limit: Math.min(ids.length, 200) }),
    // Only the author's unapproved rows: those are the pending and the rejected ones.
    ...KIND_LIST.map((def) =>
      db
        .from(def.table)
        .select(def.hiddenColumn ? "author_id,rejected_at,hidden" : "author_id,rejected_at")
        .in("author_id", ids)
        .eq("approved", false)
        .limit(5000),
    ),
  ]);
  for (const p of (profiles.data ?? []) as { id: string; display_name: string | null; created_at: string }[]) {
    out.set(p.id, { id: p.id, displayName: p.display_name ?? "Fan", createdAt: p.created_at, rejectedCount: 0, pendingCount: 0 });
  }
  if (!trust.error) {
    for (const t of (trust.data ?? []) as { id: string; trust: number }[]) {
      const a = out.get(t.id);
      if (a) a.trust = t.trust;
    }
  }
  for (const res of history) {
    for (const r of (res.data ?? []) as unknown as { author_id: string; rejected_at: string | null; hidden?: boolean }[]) {
      const a = out.get(r.author_id);
      if (!a) continue;
      if (r.rejected_at) a.rejectedCount++;
      else if (!r.hidden) a.pendingCount++;
    }
  }
  return out;
}
