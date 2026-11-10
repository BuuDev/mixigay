import { Suspense } from "react";
import { requireAdmin } from "@/features/auth/server/viewer";
import { ModerationInbox } from "@/features/moderation/components/moderation-inbox";
import { parseInboxQuery } from "@/features/moderation/lib/review";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return (
    <Suspense fallback={<p className="text-sm text-muted">Đang tải hộp duyệt…</p>}>
      <Inbox searchParams={searchParams} />
    </Suspense>
  );
}

async function Inbox({ searchParams }: { searchParams: SearchParams }) {
  const { kind, limit } = parseInboxQuery(await searchParams);
  return <ModerationInbox kind={kind} limit={limit} />;
}
