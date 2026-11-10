import { isContentKind, type ContentKind } from "./kinds";

/** Preset reasons for "Từ chối"; the author sees the final text on their account page. */
export const REJECT_PRESETS = ["Spam / quảng cáo", "Cờ bạc, cá độ", "Ngôn từ xúc phạm", "Trùng lặp", "Sai thông tin / không có nguồn", "Khác"] as const;
export const REASON_MAX = 300;

/** "Preset: note", "note" when the preset is "Khác", capped at the column's 300 characters. */
export function composeReason(preset: string, note: string): string {
  const p = (REJECT_PRESETS as readonly string[]).includes(preset.trim()) ? preset.trim() : "Khác";
  const n = note.trim().replace(/\s+/g, " ");
  const out = p === "Khác" ? n || "Khác" : n ? `${p}: ${n}` : p;
  return [...out].slice(0, REASON_MAX).join("");
}

export interface ItemRef {
  kind: ContentKind;
  id: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "kind:uuid" (the bulk checkbox value) → ref, or null. */
export function parseItemRef(raw: unknown): ItemRef | null {
  if (typeof raw !== "string") return null;
  const i = raw.indexOf(":");
  const kind = raw.slice(0, i);
  const id = raw.slice(i + 1).toLowerCase();
  return i > 0 && isContentKind(kind) && UUID.test(id) ? { kind, id } : null;
}

export const itemRef = (kind: ContentKind, id: string) => `${kind}:${id}`;

/** Refs grouped per kind, duplicates dropped. */
export function groupRefs(refs: ItemRef[]): Map<ContentKind, string[]> {
  const out = new Map<ContentKind, string[]>();
  for (const r of refs) {
    const ids = out.get(r.kind) ?? [];
    if (!ids.includes(r.id)) ids.push(r.id);
    out.set(r.kind, ids);
  }
  return out;
}

/** "tạo 2 giờ trước" — account age at a glance (fresh accounts are the usual spammers). */
export function accountAge(createdAt: string, now: number): string {
  const s = Math.max(0, (now - Date.parse(createdAt)) / 1000);
  if (!Number.isFinite(s)) return "không rõ ngày tạo";
  const steps: [number, string][] = [
    [365 * 86400, "năm"],
    [30 * 86400, "tháng"],
    [86400, "ngày"],
    [3600, "giờ"],
    [60, "phút"],
  ];
  for (const [size, unit] of steps) if (s >= size) return `tạo ${Math.floor(s / size)} ${unit} trước`;
  return "vừa tạo";
}

export function trustLabel(trust: number | null | undefined): string | undefined {
  if (trust === -1) return "đang bị cấm";
  if (trust === -2) return "đang bị cấm ngầm";
  if (trust != null && trust > 0) return "tin cậy";
  return undefined;
}

/** Friendly message when an approval is refused, or null for unexpected errors. */
export function approveErrorMessage(kind: ContentKind, error: { code?: string; message: string }): string | null {
  if (error.code === "P0403" || error.message.includes("author_banned")) return "Tác giả đang bị cấm: bỏ cấm trước rồi mới duyệt được.";
  if (error.code === "23505") {
    if (kind === "quote") return "Đã có một quote được duyệt ở đúng giây này của video.";
    if (kind === "glossary_entry") return "Đã có một mục từ cùng tên được duyệt.";
    if (kind === "suggestion") return "Đã có một đề xuất cùng tên game đang hiện.";
    return "Trùng với một mục đã duyệt.";
  }
  return null;
}

export const INBOX_STEP = 50;
export const INBOX_LIMIT_MAX = 300;

/** ?kind=&n= of /admin/duyet: unknown kind → all kinds; n in steps of 50, 50–300. */
export function parseInboxQuery(params: Record<string, string | string[] | undefined>): { kind?: ContentKind; limit: number } {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const kind = one(params.kind);
  const n = Number.parseInt(one(params.n) ?? "", 10);
  const limit = Number.isFinite(n) ? Math.min(INBOX_LIMIT_MAX, Math.max(INBOX_STEP, Math.ceil(n / INBOX_STEP) * INBOX_STEP)) : INBOX_STEP;
  return { kind: isContentKind(kind) ? kind : undefined, limit };
}

/** Link to the inbox with the given filter, dropping defaults. */
export function inboxHref(kind: ContentKind | undefined, limit = INBOX_STEP): string {
  const q = new URLSearchParams();
  if (kind) q.set("kind", kind);
  if (limit > INBOX_STEP) q.set("n", String(limit));
  const s = q.toString();
  return s ? `/admin/duyet?${s}` : "/admin/duyet";
}
