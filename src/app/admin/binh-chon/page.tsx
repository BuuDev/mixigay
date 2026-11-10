import { requireAdmin } from "@/features/auth/server/viewer";
import { PollAdmin } from "@/features/polls/admin/poll-admin";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <PollAdmin />;
}
