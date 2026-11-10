import { requireAdmin } from "@/features/auth/server/viewer";
import { QuoteAdmin } from "@/features/quotes/admin/quote-admin";

export default async function Page() {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return <QuoteAdmin />;
}
