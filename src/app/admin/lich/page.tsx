import { requireAdmin } from "@/features/auth/server/viewer";
import { ScheduleAdmin } from "@/features/schedule/admin/schedule-admin";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <ScheduleAdmin />;
}
