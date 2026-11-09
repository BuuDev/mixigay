import type { Metadata } from "next";
import { VideoBrowser } from "@/features/videos/components/video-browser";
import { getGames, getVideos } from "@/features/videos/server/queries";
import { IconGameMisc } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Video theo game – Góc Bộ Tộc" };

export default async function VideosPage() {
  const [videos, games] = await Promise.all([getVideos(), getGames()]);
  return (
    <div className="space-y-4">
      <PageHeader title="Video theo game" icon={<IconGameMisc size={26} className="text-accent" />}>
        Phân loại theo playlist chính chủ và từ khóa trong tiêu đề. Video chưa nhận diện được nằm ở mục “Chưa phân loại”.
      </PageHeader>
      <VideoBrowser videos={videos} games={games} />
    </div>
  );
}
