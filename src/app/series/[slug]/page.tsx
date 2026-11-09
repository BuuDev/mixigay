import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeList } from "@/features/series/components/episode-list";
import { SERIES_META } from "@/features/series/lib/meta";
import { getSeries, getSeriesBySlug } from "@/features/series/server/queries";
import { formatViews } from "@/shared/lib/format";
import { PageHeader } from "@/shared/ui/page-header";

// Cache Components needs at least one param; an empty catalogue falls back to a
// slug that renders the 404 page.
export async function generateStaticParams() {
  const slugs = (await getSeries()).map((s) => ({ slug: s.slug }));
  return slugs.length ? slugs : [{ slug: "phong-tra-an-lieng" }];
}

export async function generateMetadata({ params }: PageProps<"/series/[slug]">): Promise<Metadata> {
  const s = await getSeriesBySlug((await params).slug);
  return { title: s ? `${s.name} – Góc Bộ Tộc` : "Series – Góc Bộ Tộc" };
}

export default async function SeriesDetail({ params }: PageProps<"/series/[slug]">) {
  const series = await getSeriesBySlug((await params).slug);
  if (!series) notFound();
  return (
    <div className="space-y-6">
      <Link href="/series" className="text-sm text-accent hover:underline">
        ← Tất cả series
      </Link>
      <PageHeader title={series.name}>
        {SERIES_META[series.slug]?.blurb ?? "Series trên Kênh MixiGaming."} {series.episodes.length} tập · {formatViews(series.totalViews)} lượt xem.
      </PageHeader>
      <EpisodeList series={series} />
    </div>
  );
}
