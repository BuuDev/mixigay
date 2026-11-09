import { requireAdmin } from "@/lib/auth";
import { QUOTA_STOP } from "@/lib/jobs/context";
import { serverClient } from "@/lib/supabase/server";
import { Section } from "./ui";

export default async function AdminHome() {
  await requireAdmin();
  const supabase = await serverClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const [usage, live, unclassified, pending] = await Promise.all([
    supabase.from("api_usage").select("endpoint, units").eq("day", today),
    supabase.from("live_status").select("*").single(),
    supabase.from("videos").select("video_id", { count: "exact", head: true }).is("manual_game_slug", null).is("auto_game_slug", null),
    supabase.from("suggestions").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const units = (usage.data ?? []).reduce((sum, r) => sum + (r.units as number), 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
        <p className="text-xs text-muted">Kiểm tra lần cuối: {live.data?.checked_at ? new Date(live.data.checked_at).toLocaleString("vi-VN") : "chưa chạy"}</p>
      </Section>
      <Section title="Cần xử lý">
        <p>{unclassified.count ?? 0} video chưa phân loại</p>
        <p>{pending.count ?? 0} đề xuất đang chờ</p>
      </Section>
    </div>
  );
}
