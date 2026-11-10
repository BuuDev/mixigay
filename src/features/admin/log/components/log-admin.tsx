import Link from "next/link";
import { CONTENT_KINDS, KIND_LABEL, type LogKind } from "@/features/account/lib/submissions";
import { Section } from "@/features/admin/ui";
import { chipClass } from "@/shared/ui/chip";
import { serverClient } from "@/server/supabase/server";
import { profileNames } from "../../users/server/names";
import { ACTION_LABEL, isLogAction, LOG_ACTIONS, LOG_PAGE, logHref, type LogQuery } from "../lib/log-query";

interface LogRow {
  id: number;
  kind: string;
  target_id: string | null;
  author_id: string | null;
  actor_id: string | null;
  action: string;
  reason: string | null;
  snapshot: string | null;
  created_at: string;
}

const KINDS: LogKind[] = [...CONTENT_KINDS.map((k) => k.kind), "profile"];

const time = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** /admin/nhat-ky: every moderation decision (public.moderation_log, written by DB triggers). */
export async function LogAdmin({ query }: { query: LogQuery }) {
  const supabase = await serverClient();
  let req = supabase
    .from("moderation_log")
    .select("id,kind,target_id,author_id,actor_id,action,reason,snapshot,created_at")
    .order("id", { ascending: false })
    .limit(LOG_PAGE);
  if (query.action) req = req.eq("action", query.action);
  if (query.kind) req = req.eq("kind", query.kind);
  if (query.before) req = req.lt("id", query.before);
  const { data, error } = await req;
  if (error) throw new Error(`moderation_log: ${error.message}`);
  const rows = (data ?? []) as LogRow[];
  const names = await profileNames(
    supabase,
    rows.flatMap((r) => [r.actor_id, r.author_id]),
  );
  const last = rows.at(-1);

  return (
    <Section title="Nhật ký kiểm duyệt">
      <nav aria-label="Lọc theo thao tác" className="flex flex-wrap gap-2">
        <Link href={logHref(query, { action: null })} className={chipClass(!query.action)}>
          Mọi thao tác
        </Link>
        {LOG_ACTIONS.map((a) => (
          <Link key={a} href={logHref(query, { action: a })} className={chipClass(query.action === a)}>
            {ACTION_LABEL[a]}
          </Link>
        ))}
      </nav>
      <nav aria-label="Lọc theo loại nội dung" className="flex flex-wrap gap-2">
        <Link href={logHref(query, { kind: null })} className={chipClass(!query.kind)}>
          Mọi loại
        </Link>
        {KINDS.map((k) => (
          <Link key={k} href={logHref(query, { kind: k })} className={chipClass(query.kind === k)}>
            {KIND_LABEL[k]}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">Chưa có thao tác nào{query.before ? " cũ hơn" : ""}.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {rows.map((r) => (
            <li key={r.id} className="space-y-1 py-2">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <time dateTime={r.created_at} className="text-xs text-muted">
                  {time(r.created_at)}
                </time>
                <span>{r.actor_id ? (names.get(r.actor_id) ?? "?") : "hệ thống / tài khoản đã xóa"}</span>
                <strong>{isLogAction(r.action) ? ACTION_LABEL[r.action] : r.action}</strong>
                <span className="text-muted">{r.kind in KIND_LABEL ? KIND_LABEL[r.kind as LogKind] : r.kind}</span>
                {r.author_id && (
                  <span className="text-muted">
                    của{" "}
                    <Link href={`/admin/nguoi-dung?id=${r.author_id}`} className="text-foreground underline underline-offset-2">
                      {names.get(r.author_id) ?? "?"}
                    </Link>
                  </span>
                )}
              </div>
              {r.snapshot && <p className="line-clamp-2 break-words text-muted">{r.snapshot}</p>}
              {r.reason && <p className="text-xs">Lý do: {r.reason}</p>}
            </li>
          ))}
        </ul>
      )}
      {rows.length === LOG_PAGE && last && (
        <Link href={logHref(query, { before: last.id })} className={chipClass(false)}>
          Cũ hơn
        </Link>
      )}
    </Section>
  );
}
