import { connection } from "next/server";
import { Suspense } from "react";
import { getViewer } from "@/features/auth/server/viewer";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { IconAttend, IconTribe } from "@/shared/ui/icons";
import { attendanceDay } from "../lib/tonight";
import { getAttendanceCount, getMyAttendance } from "../server/queries";
import { AttendButton } from "./attend-button";

/**
 * "Tối nay tôi có mặt" (spec §4) for a page that already has the schedule. The
 * count and the viewer's own tap are read per request, so it streams in under
 * <Suspense> while the rest of the page stays static.
 */
export function AttendanceBlock({ schedule, overrides }: { schedule: ScheduleSlot[]; overrides?: ScheduleOverride[] }) {
  return (
    <Suspense fallback={<AttendanceSkeleton />}>
      <Attendance schedule={schedule} overrides={overrides} />
    </Suspense>
  );
}

async function Attendance({ schedule, overrides }: { schedule: ScheduleSlot[]; overrides?: ScheduleOverride[] }) {
  await connection(); // "today" is read at request time, never prerendered
  const dateVn = attendanceDay(new Date());
  const [viewer, count] = await Promise.all([getViewer(), getAttendanceCount(dateVn)]);
  const attended = viewer ? await getMyAttendance(viewer.id, dateVn) : false;
  return (
    <>
      <AttendButton schedule={schedule} overrides={overrides} snapshot={{ dateVn, count, attended, signedIn: Boolean(viewer) }} />
      {!isSupabaseConfigured && <p className="mt-2 text-center text-xs text-muted">Chế độ demo: số người hẹn là dữ liệu mẫu.</p>}
    </>
  );
}

/** Same footprint as the button block, so nothing shifts when it streams in. */
function AttendanceSkeleton() {
  return (
    <div className="flex min-h-36 flex-col items-center gap-3 text-center" aria-busy>
      <span className="inline-flex min-h-14 min-w-64 items-center justify-center gap-2 rounded-pill bg-accent px-8 py-3 text-lg font-semibold text-background">
        <IconAttend size={26} />
        Tối nay tôi có mặt
      </span>
      <p className="flex items-center justify-center gap-2 text-sm text-muted">
        <IconTribe size={20} className="text-accent" />
        Đang đếm người Bộ Tộc đã hẹn…
      </p>
    </div>
  );
}
