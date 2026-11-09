import Link from "next/link";
import { LiveBanner } from "@/components/live-banner";
import { VideoCard } from "@/components/video-card";
import { getGames, getLiveStatus, getSchedule, getVideos } from "@/lib/data";

export default async function Home() {
  const [status, schedule, videos, games] = await Promise.all([getLiveStatus(), getSchedule(), getVideos(), getGames()]);
  const bySlug = new Map(games.map((g) => [g.slug, g]));
  const latest = [...videos].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 6);

  return (
    <div className="space-y-8">
      <LiveBanner status={status} schedule={schedule} />
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Video mới nhất</h2>
          <Link href="/video" className="text-sm text-accent">
            Xem theo game →
          </Link>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((v) => (
            <VideoCard key={v.videoId} video={v} game={bySlug.get(v.gameSlug)} />
          ))}
        </div>
      </section>
    </div>
  );
}
