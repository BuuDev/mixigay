import { requireAdmin } from "@/features/auth/server/viewer";
import { PlayedAdmin } from "@/features/played/admin/played-admin";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <PlayedAdmin />;
}
