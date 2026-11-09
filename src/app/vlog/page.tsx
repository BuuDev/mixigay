import type { Metadata } from "next";
import { VideoCard } from "@/components/video-card";
import { getGames, getVideos } from "@/lib/data";

export const metadata: Metadata = { title: "Vlog – Góc Fan Độ" };

export default async function VlogPage() {
  const [videos, games] = await Promise.all([getVideos(), getGames()]);
  const vlogSlugs = new Set(games.filter((g) => g.isVlog).map((g) => g.slug));
  const vlogs = videos.filter((v) => vlogSlugs.has(v.gameSlug)).sort((a, b) => b.viewCount - a.viewCount);
  const bySlug = new Map(games.map((g) => [g.slug, g]));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vlog</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vlogs.map((v) => (
          <VideoCard key={v.videoId} video={v} game={bySlug.get(v.gameSlug)} />
        ))}
      </div>
    </div>
  );
}
