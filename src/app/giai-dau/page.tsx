import type { Metadata } from "next";
import { TournamentBoard } from "@/features/tournaments/components/tournament-board";
import { getTournaments } from "@/features/tournaments/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { SceneArt } from "@/shared/ui/brand-art";
import { IconCleared } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Giải đấu – Góc Bộ Tộc" };

export default async function TournamentsPage() {
  const tournaments = await getTournaments();
  return (
    <div className="space-y-6">
      <PageHeader title="Giải đấu" icon={<IconCleared size={26} className="text-accent" />} art={<SceneArt scene="17-giai-dau-esport" size={128} />}>
        Ao Làng, Moi Xoang, Tetris và các giải khác trên sóng của anh Độ. Ngày và kết quả chỉ ghi theo sóng chính thức; xem lại trên YouTube.
      </PageHeader>
      {!isSupabaseConfigured && <p className="text-sm text-muted">Chế độ demo: chỉ có tên giải, chưa có ngày hay kết quả nào.</p>}
      <TournamentBoard tournaments={tournaments} />
    </div>
  );
}
