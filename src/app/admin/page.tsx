import { requireAdmin } from "@/features/auth/server/viewer";
import { AdminOverview } from "@/features/admin/components/admin-overview";
import { ReportQueue } from "@/features/reports/admin/report-queue";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return (
    <div className="space-y-4">
      <ReportQueue />
      <AdminOverview />
    </div>
  );
}
