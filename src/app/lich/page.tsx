import type { Metadata } from "next";
import { LiveHero } from "@/features/live/components/live-hero";
import { getLiveStatus } from "@/features/live/server/queries";
import { WeekSchedule } from "@/features/schedule/components/week-schedule";
import { getSchedule } from "@/features/schedule/server/queries";
import { getGames } from "@/features/videos/server/queries";
import { IconSchedule } from "@/shared/ui/icons.generated";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Lịch stream – Tộc Đêm" };

export default async function SchedulePage() {
  const [status, schedule, games] = await Promise.all([getLiveStatus(), getSchedule(), getGames()]);
  return (
    <div className="space-y-6">
      <PageHeader title="Lịch stream tuần này" icon={<IconSchedule size={26} className="text-accent" />} />
      <LiveHero status={status} schedule={schedule} />
      <WeekSchedule schedule={schedule} games={games} />
    </div>
  );
}
