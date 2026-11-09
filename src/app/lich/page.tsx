import type { Metadata } from "next";
import { LiveBanner } from "@/components/live-banner";
import { WeekSchedule } from "@/components/week-schedule";
import { getGames, getLiveStatus, getSchedule } from "@/lib/data";

export const metadata: Metadata = { title: "Lịch stream – Góc Fan Độ" };

export default async function SchedulePage() {
  const [status, schedule, games] = await Promise.all([getLiveStatus(), getSchedule(), getGames()]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Lịch stream tuần này</h1>
      <LiveBanner status={status} schedule={schedule} />
      <WeekSchedule schedule={schedule} games={games} />
    </div>
  );
}
