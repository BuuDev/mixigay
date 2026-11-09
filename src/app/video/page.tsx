import type { Metadata } from "next";
import { VideoBrowser } from "@/components/video-browser";
import { getGames, getVideos } from "@/lib/data";

export const metadata: Metadata = { title: "Video theo game – Góc Fan Độ" };

export default async function VideosPage() {
  const [videos, games] = await Promise.all([getVideos(), getGames()]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Video theo game</h1>
      <p className="text-sm text-muted">
        Phân loại theo playlist chính chủ và từ khóa trong tiêu đề. Video chưa nhận diện được nằm ở mục “Chưa phân loại”.
      </p>
      <VideoBrowser videos={videos} games={games} />
    </div>
  );
}
