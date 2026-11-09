import { requireAdmin } from "@/features/auth/server/viewer";
import { AdminOverview } from "@/features/admin/components/admin-overview";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <AdminOverview />;
}
