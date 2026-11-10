import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SeriesCard } from "@/features/series/components/series-card";
import { getSeries } from "@/features/series/server/queries";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { Mascot } from "@/shared/ui/brand-art";
import { IconTimeline } from "@/shared/ui/icons";
import { chipClass } from "@/shared/ui/chip";
import { PageHeader } from "@/shared/ui/page-header";
import { DirectionalTransition } from "@/features/series/components/series-hero";

export const metadata: Metadata = { title: "Series – Góc Bộ Tộc" };

const PAGE = 36;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function SeriesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <DirectionalTransition>
      <div className="space-y-6">
        <PageHeader title="Series trên kênh" icon={<IconTimeline size={26} className="text-accent" />} art={<Mascot pose="stage" size={128} decorative />}>
          Tự gom theo tên series trong tiêu đề video, ví dụ “(Phòng Trà An Liễng #4)”. Series nào có tập mới thì lên đầu.
        </PageHeader>
        <h2 className="sr-only">Danh sách series</h2>
        <Suspense fallback={<div aria-hidden className="h-96 animate-pulse rounded-lg bg-surface" />}>
          <SeriesGrid searchParams={searchParams} />
        </Suspense>
      </div>
    </DirectionalTransition>
  );
}

/** One page of series cards (?n=72…); the whole catalogue never ships to the browser. */
async function SeriesGrid({ searchParams }: { searchParams: SearchParams }) {
  const [params, series] = await Promise.all([searchParams, getSeries()]);
  const raw = Number(Array.isArray(params.n) ? params.n[0] : params.n);
  const limit = Number.isInteger(raw) && raw > 0 ? Math.min(series.length, Math.ceil(raw / PAGE) * PAGE) : PAGE;
  const shown = series.slice(0, limit);
  return (
    <>
      <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((s) => (
          <SeriesCard key={s.slug} series={s} />
        ))}
      </ScrollReveal>
      <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted">
        <p>
          Đang xem {shown.length} / {series.length} series
        </p>
        {shown.length < series.length && (
          <Link href={`/series?n=${limit + PAGE}`} scroll={false} className={chipClass(false, "px-5 py-2 font-semibold text-foreground")}>
            Xem thêm series
          </Link>
        )}
      </div>
    </>
  );
}
