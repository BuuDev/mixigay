import type { Metadata } from "next";
import { Suspense } from "react";
import { ChapterTimeline } from "@/features/videos/components/chapter-timeline";
import { ShortsRail } from "@/features/videos/components/shorts-rail";
import { VideoBrowser } from "@/features/videos/components/video-browser";
import { latestStreamWithChapters } from "@/features/videos/lib/chapters";
import { PAGE, parseVideoQuery } from "@/features/videos/lib/video-query";
import { getGames, getRecentStreams, getShorts, getVideoPage } from "@/features/videos/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { formatDate } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { SceneArt } from "@/shared/ui/brand-art";
import { IconGameMisc, IconTimeline } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Video theo game – Góc Bộ Tộc" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VideosPage({ searchParams }: { searchParams: SearchParams }) {
  const [streams, shorts] = await Promise.all([getRecentStreams(), getShorts()]);
  const stream = latestStreamWithChapters(streams);
  return (
    <div className="space-y-8">
      <PageHeader title="Video theo game" icon={<IconGameMisc size={26} className="text-accent" />} art={<SceneArt scene="10-xem-lai-vod" size={128} />}>
        Phân loại theo playlist chính chủ và từ khóa trong tiêu đề. Video chưa nhận diện được nằm ở mục “Chưa phân loại”.
      </PageHeader>

      {stream?.chapters && (
        <section aria-labelledby="timeline-heading" className="rounded-lg border border-border bg-surface p-4 shadow-card">
          <h2 id="timeline-heading" className="flex items-center gap-2 text-lg font-bold">
            <IconTimeline size={22} className="text-accent" />
            Timeline buổi stream gần nhất
          </h2>
          <p className="mt-1 text-sm text-muted">
            <a
              href={youtubeUrl(stream.videoId)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground underline underline-offset-2"
            >
              {stream.title}
            </a>{" "}
            · {formatDate(stream.publishedAt)} ·{" "}
            {isSupabaseConfigured
              ? "theo các chương trong mô tả video, bấm mốc giờ để xem trên YouTube."
              : "chế độ demo: chương mẫu, không phải chương thật của video."}
          </p>
          <ChapterTimeline videoId={stream.videoId} chapters={stream.chapters} label="Các chương của buổi stream" className="mt-4" />
        </section>
      )}

      {shorts.length > 0 && (
        <section aria-labelledby="shorts-heading">
          <h2 id="shorts-heading" className="mb-3 text-lg font-bold">
            Shorts mới
          </h2>
          <ShortsRail shorts={shorts} />
        </section>
      )}

      {/* Only this part reads the URL; everything above stays in the static shell. */}
      <Suspense fallback={<GridSkeleton />}>
        <FilteredVideos searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FilteredVideos({ searchParams }: { searchParams: SearchParams }) {
  const [params, games] = await Promise.all([searchParams, getGames()]);
  const query = parseVideoQuery(
    params,
    games.map((g) => g.slug),
  );
  const data = await getVideoPage(query.game, query.sort, query.limit);
  return <VideoBrowser query={query} {...data} />;
}

function GridSkeleton() {
  return (
    <div aria-hidden className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: Math.min(PAGE, 6) }, (_, i) => (
        <div key={i} className="aspect-video animate-pulse rounded-lg bg-surface" />
      ))}
    </div>
  );
}
