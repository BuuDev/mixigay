import type { Metadata } from "next";
import { PlayedList } from "@/features/played/components/played-list";
import { getPlayedGames } from "@/features/played/server/queries";
import { getSuggestions } from "@/features/suggestions/server/queries";
import { gameCovers } from "@/features/videos/lib/game-cover";
import { getGames, getVideos } from "@/features/videos/server/queries";
import { Mascot } from "@/shared/ui/brand-art";
import { IconCleared } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Anh Độ đã chơi – Góc Bộ Tộc" };

export default async function PlayedPage() {
  const [played, games, suggestions, videos] = await Promise.all([getPlayedGames(), getGames(), getSuggestions(), getVideos()]);
  const covers = gameCovers(videos, games);
  return (
    <div className="space-y-6">
      <PageHeader title="Anh Độ đã chơi" icon={<IconCleared size={26} className="text-cleared" />} art={<Mascot pose="gaming" size={128} decorative />}>
        Trước khi đề xuất game, xem qua danh sách này để tránh trùng nhé.
      </PageHeader>
      <PlayedList played={played} games={games} suggestions={suggestions} covers={covers} />
    </div>
  );
}
