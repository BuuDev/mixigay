import { requireAdmin } from "@/features/auth/server/viewer";
import { SongAdmin } from "@/features/music/admin/song-admin";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <SongAdmin />;
}
