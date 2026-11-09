import type { Metadata } from "next";
import { SeriesCard } from "@/features/series/components/series-card";
import { getSeries } from "@/features/series/server/queries";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { IconTimeline } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";
import { DirectionalTransition } from "@/features/series/components/series-hero";

export const metadata: Metadata = { title: "Series – Góc Bộ Tộc" };

export default async function SeriesPage() {
  const series = await getSeries();
  return (
    <DirectionalTransition>
      <div className="space-y-6">
        <PageHeader title="Series trên kênh" icon={<IconTimeline size={26} className="text-accent" />}>
          Tự gom theo tên series trong tiêu đề video, ví dụ “(Phòng Trà An Liễng #4)”. Series nào có tập mới thì lên đầu.
        </PageHeader>
        <h2 className="sr-only">Danh sách series</h2>
        <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <SeriesCard key={s.slug} series={s} />
          ))}
        </ScrollReveal>
      </div>
    </DirectionalTransition>
  );
}
