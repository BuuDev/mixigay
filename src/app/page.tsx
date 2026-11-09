import Link from "next/link";
import { LiveHero } from "@/features/live/components/live-hero";
import { getLiveStatus } from "@/features/live/server/queries";
import { getSchedule } from "@/features/schedule/server/queries";
import { VideoGrid } from "@/features/videos/components/video-grid";
import { getGames, getVideos } from "@/features/videos/server/queries";

export default async function Home() {
  const [status, schedule, videos, games] = await Promise.all([getLiveStatus(), getSchedule(), getVideos(), getGames()]);
  const latest = [...videos].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 6);

  return (
    <div className="space-y-10">
      <LiveHero status={status} schedule={schedule} embers />
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Video mới nhất</h2>
          <Link href="/video" className="text-sm text-accent hover:underline">
            Xem theo game →
          </Link>
        </div>
        <div className="mt-3">
          <VideoGrid videos={latest} games={games} />
        </div>
      </section>
    </div>
  );
}
