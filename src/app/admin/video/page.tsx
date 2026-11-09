import { requireAdmin } from "@/features/auth/server/viewer";
import { VideoAdmin } from "@/features/videos/admin/video-admin";

export default async function Page({ searchParams }: PageProps<"/admin/video">) {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  const { q } = await searchParams;
  return <VideoAdmin search={String(q ?? "")} />;
}
