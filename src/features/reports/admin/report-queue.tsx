import Link from "next/link";
import { button, primary, Section } from "@/features/admin/ui";
import { serverClient } from "@/server/supabase/server";
import { formatDate } from "@/shared/lib/format";
import { KIND_LABEL, REASON_LABEL, type ReportKind, type ReportReason } from "../lib/reasons";
import { resolveReports, takeDown } from "./actions";

interface Row {
  target_kind: ReportKind;
  target_id: string;
  reason: ReportReason;
  created_at: string;
}

interface Group {
  kind: ReportKind;
  id: string;
  count: number;
  reasons: Partial<Record<ReportReason, number>>;
  latest: string;
  label: string;
}

/**
 * The shared moderation queue at the top of /admin: what waits for approval in each
 * section, and open reports grouped per target, most-reported first. A report never
 * hides anything by itself (brigading); the admin decides.
 */
export async function ReportQueue() {
  const supabase = await serverClient();
  // Pending counts per kind live in the "Hàng chờ" grid and /admin/duyet; this card is reports only.
  const reports = await supabase
    .from("reports")
    .select("target_kind,target_id,reason,created_at")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(500);

  const groups = new Map<string, Group>();
  for (const r of (reports.data ?? []) as Row[]) {
    const key = `${r.target_kind}:${r.target_id}`;
    const g = groups.get(key) ?? { kind: r.target_kind, id: r.target_id, count: 0, reasons: {}, latest: r.created_at, label: r.target_id.slice(0, 8) };
    g.count++;
    g.reasons[r.reason] = (g.reasons[r.reason] ?? 0) + 1;
    groups.set(key, g);
  }
  // Impersonation of anh Độ / the channel first, then the most-reported.
  const impersonation = (g: Group) => (g.reasons.impersonation ? 1 : 0);
  const list = [...groups.values()]
    .sort((a, b) => impersonation(b) - impersonation(a) || b.count - a.count || Date.parse(b.latest) - Date.parse(a.latest))
    .slice(0, 50);

  // Human-readable labels for the reported targets.
  const ids = (k: ReportKind) => list.filter((g) => g.kind === k).map((g) => g.id);
  const [sug, songs, people, wallRows, quoteRows, glossRows, quizRows] = await Promise.all([
    ids("suggestion").length ? supabase.from("suggestions").select("id,name").in("id", ids("suggestion")) : { data: [] },
    ids("fan_song").length ? supabase.from("fan_songs").select("id,title").in("id", ids("fan_song")) : { data: [] },
    ids("profile").length ? supabase.from("profiles").select("id,display_name").in("id", ids("profile")) : { data: [] },
    ids("wall_message").length ? supabase.from("wall_messages").select("id,body").in("id", ids("wall_message")) : { data: [] },
    ids("quote").length ? supabase.from("quotes").select("id,body").in("id", ids("quote")) : { data: [] },
    ids("glossary_entry").length ? supabase.from("glossary_entries").select("id,term").in("id", ids("glossary_entry")) : { data: [] },
    ids("quiz_link").length ? supabase.from("quiz_links").select("id,title").in("id", ids("quiz_link")) : { data: [] },
  ]);
  const names = new Map<string, string>([
    ...((sug.data ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name] as const),
    ...((songs.data ?? []) as { id: string; title: string }[]).map((r) => [r.id, r.title] as const),
    ...((people.data ?? []) as { id: string; display_name: string }[]).map((r) => [r.id, r.display_name] as const),
    ...((wallRows.data ?? []) as { id: string; body: string }[]).map((r) => [r.id, `“${r.body}”`] as const),
    ...((quoteRows.data ?? []) as { id: string; body: string }[]).map((r) => [r.id, `“${r.body}”`] as const),
    ...((glossRows.data ?? []) as { id: string; term: string }[]).map((r) => [r.id, r.term] as const),
    ...((quizRows.data ?? []) as { id: string; title: string }[]).map((r) => [r.id, r.title] as const),
  ]);

  return (
    <Section title="Báo cáo của fan">
      <ul className="flex flex-wrap gap-2 text-sm">
        <li>
          <Link href="/admin/duyet" className={button}>
            Mở hộp duyệt
          </Link>
        </li>
        <li className="self-center text-muted">{groups.size} mục bị báo cáo</li>
      </ul>
      {list.length > 0 && (
        <ul className="divide-y divide-border text-sm">
          {list.map((g) => (
            <li key={`${g.kind}:${g.id}`} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <strong>{names.get(g.id) ?? `(đã xóa) ${g.label}`}</strong>{" "}
                <span className="text-muted">
                  · {KIND_LABEL[g.kind]} · {g.count} báo cáo · mới nhất {formatDate(g.latest)}
                </span>
                <span className="block text-xs text-muted">
                  {Object.entries(g.reasons)
                    .map(([r, n]) => `${REASON_LABEL[r as ReportReason]} (${n})`)
                    .join(", ")}
                </span>
              </span>
              <form action={takeDown.bind(null, g.kind, g.id)}>
                <button className={primary}>{g.kind === "profile" ? "Reset tên" : "Gỡ xuống"}</button>
              </form>
              <form action={resolveReports.bind(null, g.kind, g.id)}>
                <button className={button}>Bỏ qua</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
