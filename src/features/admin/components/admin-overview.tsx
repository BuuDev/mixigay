import Link from "next/link";
import { KIND_LIST } from "@/features/moderation/lib/kinds";
import { inboxHref } from "@/features/moderation/lib/review";
import { getPendingCounts, totalPending } from "@/features/moderation/server/inbox";
import { QUOTA_STOP } from "@/server/jobs/context";
import { serverClient } from "@/server/supabase/server";
import { Section } from "../ui";

/** Per-request cutoff (the overview is dynamic admin data, never cached). */
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();

export async function AdminOverview() {
  const supabase = await serverClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const dayAgo = hoursAgo(24);
  const [usage, live, poll, unclassified, pending, queue, newAccounts, rejected] = await Promise.all([
    supabase.from("api_usage").select("endpoint, units").eq("day", today),
    supabase.from("live_status").select("*").single(),
    supabase.from("live_poll_state").select("checked_at, next_check_at, reason").maybeSingle(),
    supabase.from("videos").select("video_id", { count: "exact", head: true }).is("manual_game_slug", null).is("auto_game_slug", null),
    supabase.from("suggestions").select("id", { count: "exact", head: true }).eq("status", "pending").eq("approved", true).eq("hidden", false),
    getPendingCounts(),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
    // moderation_log rows are written by DB triggers (20261110200000_moderation_center.sql).
    supabase.from("moderation_log").select("id", { count: "exact", head: true }).eq("action", "reject").gte("created_at", dayAgo),
  ]);
  const units = (usage.data ?? []).reduce((sum, r) => sum + (r.units as number), 0);

  const cell = "block rounded-md border border-border p-2 hover:border-accent";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Section title={`Hàng chờ (${totalPending(queue)} mục chờ duyệt)`}>
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-5">
            {KIND_LIST.map((k) => (
              <li key={k.kind}>
                <Link href={inboxHref(k.kind)} className={cell}>
                  <span className="block text-xl font-bold tabular-nums">{queue[k.kind]}</span>
                  {k.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/admin" className={cell}>
                <span className="block text-xl font-bold tabular-nums">{queue.reports}</span>
                Báo cáo mở
              </Link>
            </li>
            <li className="rounded-md border border-border p-2">
              <span className="block text-xl font-bold tabular-nums">{newAccounts.count ?? 0}</span>
              Tài khoản mới (24 giờ)
            </li>
            <li className="rounded-md border border-border p-2">
              <span className="block text-xl font-bold tabular-nums">{rejected.count ?? 0}</span>
              Đã từ chối (24 giờ)
            </li>
          </ul>
        </Section>
      </div>
      <Section title="Quota YouTube hôm nay (giờ Thái Bình Dương)">
        <p className="text-2xl font-bold tabular-nums">
          {units} <span className="text-sm font-normal text-muted">/ 10.000 (job dừng ở {QUOTA_STOP})</span>
        </p>
        <ul className="text-xs text-muted">
          {(usage.data ?? []).map((r) => (
            <li key={r.endpoint as string}>
              {r.endpoint as string}: {r.units as number}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Trạng thái live">
        <p>
          <strong>{live.data?.state ?? "?"}</strong> {live.data?.title && `– ${live.data.title}`}
        </p>
        <p className="text-xs text-muted">Kiểm tra lần cuối: {poll.data?.checked_at ? vnTime(poll.data.checked_at as string) : "chưa chạy"}</p>
        <p className="text-xs text-muted">
          Lần kiểm tra kế tiếp: {poll.data?.next_check_at ? vnTime(poll.data.next_check_at as string) : "?"}
          {poll.data?.reason ? ` (${POLL_REASON[poll.data.reason as string] ?? (poll.data.reason as string)})` : ""}
        </p>
      </Section>
      <Section title="Cần xử lý">
        <p>{unclassified.count ?? 0} video chưa phân loại</p>
        <p>{pending.count ?? 0} đề xuất đã hiện, chờ anh Độ chơi</p>
      </Section>
    </div>
  );
}

// Why poll-live sleeps until the next check (src/features/live/lib/live.ts nextCheckAt).
const POLL_REASON: Record<string, string> = {
  live_end: "đang live, kiểm tra lúc kết ca (4 tiếng sau giờ bắt đầu)",
  live_overtime: "live quá giờ, 15 phút một lần",
  upcoming_soon: "sắp tới giờ hẹn, 2 phút một lần",
  upcoming_wait: "chờ tới 2 phút trước giờ hẹn",
  slot_window: "đầu ca, 2 phút một lần tới khi lên sóng",
  next_slot: "chờ khung giờ lịch kế tiếp",
  safety: "kiểm tra dự phòng 6 tiếng một lần",
  schedule_changed: "lịch vừa đổi, kiểm tra ngay",
  websub: "YouTube vừa báo có stream, kiểm tra ngay",
  retry: "lần trước lỗi, thử lại sau 5 phút",
};

function vnTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}
