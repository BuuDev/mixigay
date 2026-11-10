import { requireAdmin } from "@/features/auth/server/viewer";
import { SkinAdmin } from "@/features/themes/admin/skin-admin";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <SkinAdmin />;
}
