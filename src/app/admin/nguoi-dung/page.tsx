import { Suspense } from "react";
import { UserDetail } from "@/features/admin/users/components/user-detail";
import { UsersAdmin } from "@/features/admin/users/components/users-admin";
import { parseUserQuery } from "@/features/admin/users/lib/user-query";
import { requireAdmin } from "@/features/auth/server/viewer";

export default async function Page({ searchParams }: PageProps<"/admin/nguoi-dung">) {
  await requireAdmin(); // every admin page checks itself: layouts do not guard parallel-rendered pages
  return (
    <Suspense fallback={<p className="text-sm text-muted">Đang tải người dùng…</p>}>
      <Users searchParams={searchParams} />
    </Suspense>
  );
}

async function Users({ searchParams }: Pick<PageProps<"/admin/nguoi-dung">, "searchParams">) {
  const query = parseUserQuery(await searchParams);
  return query.id ? <UserDetail id={query.id} /> : <UsersAdmin query={query} />;
}
