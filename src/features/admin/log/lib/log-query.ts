import { isLogKind, type LogKind } from "@/features/account/lib/submissions";

export const LOG_PAGE = 100;

export const LOG_ACTIONS = ["approve", "unapprove", "reject", "delete", "ban", "shadow", "unban"] as const;
export type LogAction = (typeof LOG_ACTIONS)[number];

export const ACTION_LABEL: Record<LogAction, string> = {
  approve: "Duyệt",
  unapprove: "Bỏ duyệt",
  reject: "Từ chối",
  delete: "Xóa",
  ban: "Cấm",
  shadow: "Cấm ngầm",
  unban: "Bỏ cấm",
};

export const isLogAction = (a: string): a is LogAction => (LOG_ACTIONS as readonly string[]).includes(a);

export interface LogQuery {
  action: LogAction | null;
  kind: LogKind | null;
  /** Show rows with id < before (paging, newest first). */
  before: number | null;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** ?action=&kind=&before=; anything unknown is ignored. */
export function parseLogQuery(params: Params): LogQuery {
  const action = one(params.action);
  const kind = one(params.kind);
  const before = one(params.before);
  return {
    action: isLogAction(action) ? action : null,
    kind: isLogKind(kind) ? kind : null,
    before: /^[1-9]\d{0,15}$/.test(before) ? Number(before) : null,
  };
}

/** Link to the log with some filters changed; changing a filter restarts paging. */
export function logHref(q: LogQuery, change: Partial<LogQuery>): string {
  const next = { ...q, before: null, ...change };
  const sp = new URLSearchParams();
  if (next.action) sp.set("action", next.action);
  if (next.kind) sp.set("kind", next.kind);
  if (next.before) sp.set("before", String(next.before));
  const s = sp.toString();
  return s ? `/admin/nhat-ky?${s}` : "/admin/nhat-ky";
}
