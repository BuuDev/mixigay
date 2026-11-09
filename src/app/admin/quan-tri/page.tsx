import { AccessAdmin } from "@/features/admin/access/access-admin";
import { requireAdmin } from "@/features/auth/server/viewer";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <AccessAdmin />;
}
