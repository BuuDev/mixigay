import Link from "next/link";
import { button, input, Section } from "@/features/admin/ui";
import { RelativeTime } from "@/features/wall/components/relative-time";
import { chipClass } from "@/shared/ui/chip";
import { USER_PAGE, type TrustFilter, type UserQuery } from "../lib/user-query";
import { listProfiles } from "../server/profiles";
import { getOpenProfileReports, getSubmissionCounts } from "../server/queries";
import { TrustBadges } from "./trust-badges";

const FILTERS: { value: TrustFilter | null; label: string }[] = [
  { value: null, label: "Tất cả" },
  { value: "banned", label: "Bị cấm" },
  { value: "shadow", label: "Cấm ngầm" },
];

const href = (q: string, trust: TrustFilter | null) => {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (trust) sp.set("trust", trust);
  const s = sp.toString();
  return s ? `/admin/nguoi-dung?${s}` : "/admin/nguoi-dung";
};

/** /admin/nguoi-dung: newest accounts with what they posted and reports against them. */
export async function UsersAdmin({ query }: { query: UserQuery }) {
  const profiles = await listProfiles(query);
  const ids = profiles.map((p) => p.id);
  const [counts, reports] = await Promise.all([getSubmissionCounts(ids), getOpenProfileReports(ids)]);

  return (
    <Section title="Người dùng">
      <form action="/admin/nguoi-dung" className="flex flex-wrap items-center gap-2">
        <label htmlFor="user-q" className="sr-only">
          Tìm theo tên hiển thị
        </label>
        <input id="user-q" name="q" defaultValue={query.q} placeholder="Tìm theo tên hiển thị" maxLength={60} className={input} />
        {query.trust && <input type="hidden" name="trust" value={query.trust} />}
        <button className={button}>Tìm</button>
      </form>
      <nav aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.label} href={href(query.q, f.value)} className={chipClass(query.trust === f.value)}>
            {f.label}
          </Link>
        ))}
      </nav>
      <p className="text-xs text-muted">{USER_PAGE} tài khoản mới nhất khớp bộ lọc. Số bài: chờ duyệt / đã duyệt / bị từ chối trên mọi loại nội dung.</p>
      {profiles.length === 0 ? (
        <p className="text-sm text-muted">Không có tài khoản nào khớp.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {profiles.map((p) => {
            const c = counts.get(p.id) ?? { pending: 0, approved: 0, rejected: 0 };
            const open = reports.get(p.id) ?? 0;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <Link href={`/admin/nguoi-dung?id=${p.id}`} className="font-semibold underline underline-offset-2">
                  {p.displayName}
                </Link>
                <TrustBadges trust={p.trust} verified={p.verified} />
                <RelativeTime iso={p.createdAt} className="text-xs text-muted" />
                <span className="text-xs text-muted">
                  {c.pending} chờ · {c.approved} duyệt · {c.rejected} từ chối
                </span>
                {open > 0 && <span className="rounded bg-live/15 px-1.5 text-xs font-semibold text-live-text">{open} báo cáo</span>}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
