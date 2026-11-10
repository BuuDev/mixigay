import { requireAdmin } from "@/features/auth/server/viewer";
import { TournamentAdmin } from "@/features/tournaments/admin/tournament-admin";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <TournamentAdmin />;
}
