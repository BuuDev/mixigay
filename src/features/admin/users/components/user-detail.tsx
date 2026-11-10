import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmissionList } from "@/features/account/components/submission-list";
import { KIND_LABEL, type LogKind } from "@/features/account/lib/submissions";
import { UserModeration } from "@/features/admin/components/user-moderation";
import { Section } from "@/features/admin/ui";
import { formatDate } from "@/shared/lib/format";
import { serverClient } from "@/server/supabase/server";
import { ACTION_LABEL, isLogAction } from "../../log/lib/log-query";
import { REPORT_REASON } from "../lib/user-query";
import { profileNames } from "../server/names";
import { getProfile } from "../server/profiles";
import { getProfileReports, getUserLog, getUserSubmissions } from "../server/queries";
import { TrustBadges } from "./trust-badges";

/** /admin/nguoi-dung?id=…: one account, what they posted, what was decided, reports, tools. */
export async function UserDetail({ id }: { id: string }) {
  const [profile, submissions, log, reports] = await Promise.all([getProfile(id), getUserSubmissions(id), getUserLog(id), getProfileReports(id)]);
  if (!profile) notFound();
  const actors = await profileNames(
    await serverClient(),
    log.map((r) => r.actor_id),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/admin/nguoi-dung" className="underline underline-offset-2">
          Danh sách người dùng
        </Link>
      </p>
      <Section title={profile.displayName}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <TrustBadges trust={profile.trust} verified={profile.verified} />
          <span className="text-muted">Tạo ngày {formatDate(profile.createdAt)}</span>
        </div>
        <p className="text-xs break-all text-muted">ID: {profile.id}</p>
        <UserModeration userId={profile.id} />
      </Section>

      <Section title={`Báo cáo về tài khoản (${reports.length})`}>
        {reports.length === 0 ? (
          <p className="text-sm text-muted">Không có báo cáo nào.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {reports.map((r) => (
              <li key={r.id} className="py-2">
                <strong>{REPORT_REASON[r.reason] ?? r.reason}</strong>
                <span className="text-muted">
                  {" "}
                  · {formatDate(r.created_at)} · {r.resolved ? "đã xử lý" : "chưa xử lý"}
                </span>
                {r.note && <p className="text-muted">{r.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Bài đã gửi (${submissions.length} gần nhất)`}>
        {submissions.length === 0 ? <p className="text-sm text-muted">Chưa gửi gì.</p> : <SubmissionList items={submissions} />}
      </Section>

      <Section title="Nhật ký kiểm duyệt">
        {log.length === 0 ? (
          <p className="text-sm text-muted">Chưa có thao tác nào.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {log.map((r) => (
              <li key={r.id} className="space-y-1 py-2">
                <div className="flex flex-wrap gap-x-2">
                  <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                  <span>{r.actor_id ? (actors.get(r.actor_id) ?? "?") : "hệ thống / tài khoản đã xóa"}</span>
                  <strong>{isLogAction(r.action) ? ACTION_LABEL[r.action] : r.action}</strong>
                  <span className="text-muted">{r.kind in KIND_LABEL ? KIND_LABEL[r.kind as LogKind] : r.kind}</span>
                </div>
                {r.snapshot && <p className="line-clamp-2 break-words text-muted">{r.snapshot}</p>}
                {r.reason && <p className="text-xs">Lý do: {r.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
