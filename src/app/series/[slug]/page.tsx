import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeList } from "@/features/series/components/episode-list";
import { DirectionalTransition, SeriesHero } from "@/features/series/components/series-hero";
import { SERIES_META } from "@/features/series/lib/meta";
import { getSeries, getSeriesBySlug } from "@/features/series/server/queries";
import { formatViews } from "@/shared/lib/format";

// Cache Components needs at least one param; an empty catalogue falls back to a
// slug that renders the 404 page. Only the most recently active series are built
// ahead; the rest render on first visit and are cached (dynamicParams stays on).
const PREBUILT = 24;
export async function generateStaticParams() {
  const slugs = (await getSeries()).slice(0, PREBUILT).map((s) => ({ slug: s.slug }));
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
    <DirectionalTransition>
      <div className="space-y-6">
        <Link href="/series" prefetch transitionTypes={["nav-back"]} className="text-sm text-accent hover:underline">
          ← Tất cả series
        </Link>
        <SeriesHero series={series}>
          {SERIES_META[series.slug]?.blurb ?? "Series trên Kênh MixiGaming."} {series.episodes.length} tập · {formatViews(series.totalViews)} lượt xem.
        </SeriesHero>
        <EpisodeList series={series} />
      </div>
    </DirectionalTransition>
  );
}
