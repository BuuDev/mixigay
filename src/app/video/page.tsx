import type { Metadata } from "next";
import { ChapterTimeline } from "@/features/videos/components/chapter-timeline";
import { ShortsRail } from "@/features/videos/components/shorts-rail";
import { VideoBrowser } from "@/features/videos/components/video-browser";
import { latestStreamWithChapters } from "@/features/videos/lib/chapters";
import { gameCoverRecord } from "@/features/videos/lib/game-cover";
import { getGames, getShorts, getVideos } from "@/features/videos/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { formatDate } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { SceneArt } from "@/shared/ui/brand-art";
import { IconGameMisc, IconTimeline } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Video theo game – Góc Bộ Tộc" };

export default async function VideosPage() {
  const [videos, games, shorts] = await Promise.all([getVideos(), getGames(), getShorts()]);
  const stream = latestStreamWithChapters(videos);
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

      <VideoBrowser videos={videos} games={games} covers={gameCoverRecord(videos, games)} />
    </div>
  );
}
