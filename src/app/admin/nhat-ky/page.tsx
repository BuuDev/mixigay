import { Suspense } from "react";
import { LogAdmin } from "@/features/admin/log/components/log-admin";
import { parseLogQuery } from "@/features/admin/log/lib/log-query";
import { requireAdmin } from "@/features/auth/server/viewer";

export default async function Page({ searchParams }: PageProps<"/admin/nhat-ky">) {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return (
    <Suspense fallback={<p className="text-sm text-muted">Đang tải nhật ký…</p>}>
      <Log searchParams={searchParams} />
    </Suspense>
  );
}

async function Log({ searchParams }: Pick<PageProps<"/admin/nhat-ky">, "searchParams">) {
  return <LogAdmin query={parseLogQuery(await searchParams)} />;
}
