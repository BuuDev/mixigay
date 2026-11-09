import { requireAdmin } from "@/features/auth/server/viewer";
import { WallAdmin } from "@/features/wall/admin/wall-admin";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <WallAdmin />;
}
