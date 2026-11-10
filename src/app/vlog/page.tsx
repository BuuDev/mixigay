import type { Metadata } from "next";
import { VideoGrid } from "@/features/videos/components/video-grid";
import { getGames, getVideos } from "@/features/videos/server/queries";
import { Mascot } from "@/shared/ui/brand-art";
import { IconVlog } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Vlog – Góc Bộ Tộc" };

export default async function VlogPage() {
  const [videos, games] = await Promise.all([getVideos(), getGames()]);
  const vlogSlugs = new Set(games.filter((g) => g.isVlog).map((g) => g.slug));
  const vlogs = videos.filter((v) => vlogSlugs.has(v.gameSlug)).sort((a, b) => b.viewCount - a.viewCount);
  return (
    <div className="space-y-4">
      <PageHeader title="Vlog" icon={<IconVlog size={26} className="text-accent" />} art={<Mascot pose="vod" size={128} decorative />} />
      <VideoGrid videos={vlogs} games={games} />
    </div>
  );
}
