import type { Metadata } from "next";
import { StatTiles } from "@/features/stats/components/stat-tiles";
import { StreamExplorer } from "@/features/stats/components/stream-explorer";
import { TopStreams } from "@/features/stats/components/top-streams";
import { WeekdayStarts } from "@/features/stats/components/weekday-starts";
import { getStreamStats } from "@/features/stats/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { EmptyState } from "@/shared/ui/empty-state";
import { IconTimeline } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = {
  title: "Thống kê stream – Góc Bộ Tộc",
  description: "Số người xem theo thời gian, giờ lên sóng trung bình và những buổi live đông người xem nhất của anh Độ, do fan tự ghi lại.",
};

export default async function StatsPage() {
  const stats = await getStreamStats();
  return (
    <div className="space-y-8">
      <PageHeader title="Thống kê stream" icon={<IconTimeline size={26} className="text-accent" />}>
        Số người xem cùng lúc do Góc Bộ Tộc tự ghi lại khoảng mỗi phút khi anh Độ live trên YouTube (dữ liệu cũ hơn 30 ngày gộp còn 5 phút một mẫu), trong{" "}
        {stats.windowDays} ngày gần nhất. Đây là số liệu fan tự thu, không phải số chính thức của kênh. Giờ tính theo giờ Việt Nam.
      </PageHeader>

      {!isSupabaseConfigured && (
        <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted">Chế độ demo: các con số dưới đây là dữ liệu mẫu.</p>
      )}

      {stats.streamCount === 0 ? (
        <EmptyState art="empty-videos" title="Chưa có số liệu người xem">
          Trang bắt đầu ghi số người xem từ buổi live đầu tiên sau khi được bật, nên hiện chưa có gì để thống kê. Quay lại sau buổi live tới nhé.
        </EmptyState>
      ) : (
        <>
          <section aria-labelledby="stats-overview">
            <h2 id="stats-overview" className="sr-only">
              Tổng quan
            </h2>
            <StatTiles stats={stats} />
          </section>

          <section aria-labelledby="stats-viewers" className="space-y-3">
            <h2 id="stats-viewers" className="text-xl font-bold">
              Người xem theo thời gian
            </h2>
            <StreamExplorer streams={stats.recent} />
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section aria-labelledby="stats-weekdays" className="flex flex-col gap-3">
              <h2 id="stats-weekdays" className="text-xl font-bold">
                Giờ lên sóng trung bình theo thứ
              </h2>
              <div className="flex-1 rounded-lg border border-border bg-surface p-4 shadow-card">
                <WeekdayStarts weekdays={stats.weekdays} />
                <p className="mt-3 text-xs text-muted">Buổi bắt đầu sau nửa đêm (trước 6 giờ sáng) được tính vào tối hôm trước.</p>
              </div>
            </section>

            <section aria-labelledby="stats-top" className="flex flex-col gap-3">
              <h2 id="stats-top" className="text-xl font-bold">
                Top buổi đông người xem nhất
              </h2>
              <div className="flex-1 rounded-lg border border-border bg-surface p-4 shadow-card">
                {stats.top.length ? <TopStreams streams={stats.top} /> : <p className="text-sm text-muted">Chưa buổi nào có số người xem được ghi lại.</p>}
                <p className="mt-3 text-xs text-muted">Xếp theo số người xem cùng lúc cao nhất trong buổi.</p>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
