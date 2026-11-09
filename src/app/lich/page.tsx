import type { Metadata } from "next";
import { AttendanceBlock } from "@/features/attendance/components/attendance-block";
import { LiveHero } from "@/features/live/components/live-hero";
import { getLiveStatus } from "@/features/live/server/queries";
import { EventRadar } from "@/features/events/components/event-radar";
import { WeekSchedule } from "@/features/schedule/components/week-schedule";
import { getSchedule, getScheduleOverrides } from "@/features/schedule/server/queries";
import { getGames } from "@/features/videos/server/queries";
import { IconSchedule } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Lịch stream – Góc Bộ Tộc" };

export default async function SchedulePage() {
  const [status, schedule, overrides, games] = await Promise.all([getLiveStatus(), getSchedule(), getScheduleOverrides(), getGames()]);
  return (
    <div className="space-y-6">
      <PageHeader title="Lịch stream tuần này" icon={<IconSchedule size={26} className="text-accent" />} />
      <LiveHero status={status} schedule={schedule} overrides={overrides} />
      <AttendanceBlock schedule={schedule} overrides={overrides} />
      <WeekSchedule schedule={schedule} games={games} overrides={overrides} />
      <section className="space-y-3 pt-6">
        <h2 className="text-xl font-extrabold">Radar sự kiện Bộ Tộc</h2>
        <EventRadar />
      </section>
    </div>
  );
}
