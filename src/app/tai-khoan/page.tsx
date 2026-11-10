import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MySubmissions } from "@/features/account/components/my-submissions";
import { StreakBadge } from "@/features/attendance/components/streak-badge";
import { signOut } from "@/features/auth/actions";
import { PassphraseForm } from "@/features/auth/components/passphrase-form";
import { getViewer } from "@/features/auth/server/viewer";
import { SceneArt } from "@/shared/ui/brand-art";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Tài khoản – Góc Bộ Tộc", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <PageHeader title="Tài khoản" art={<SceneArt scene="11-dang-ky" size={112} />} />
      <Suspense fallback={<p className="text-sm text-muted">Đang tải…</p>}>
        <Account />
      </Suspense>
    </div>
  );
}

async function Account() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  return (
    <>
      <Card className="p-5 text-sm">
        <p>
          Bạn đang là <strong>{viewer.name}</strong>
          {viewer.verified && <span className="ml-1 rounded bg-cleared/15 px-1.5 font-semibold text-cleared">✓ Chính chủ</span>}
        </p>
        <p className="mt-2 text-muted">Trang không lưu email hay số điện thoại của bạn. Mất mã khóa thì không khôi phục được, nên hãy lưu kỹ.</p>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Đổi mã khóa</h2>
        <PassphraseForm />
      </Card>
      <Card className="p-5">
        <StreakBadge userId={viewer.id} />
      </Card>
      <Card className="p-5">
        <MySubmissions userId={viewer.id} />
      </Card>
      <form action={signOut}>
        <Button variant="secondary">Thoát tài khoản</Button>
      </form>
    </>
  );
}
