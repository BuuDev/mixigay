import { getSchedule, getScheduleOverrides } from "@/features/schedule/server/queries";
import { getLiveStatus } from "../server/queries";
import { LiveDock } from "./live-dock";

/** Server wrapper so the root layout can place the floating dock on every page. */
export async function LiveDockSlot() {
  const [status, schedule, overrides] = await Promise.all([getLiveStatus(), getSchedule(), getScheduleOverrides()]);
  return <LiveDock status={status} schedule={schedule} overrides={overrides} />;
}
