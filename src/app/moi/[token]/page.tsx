import type { Metadata } from "next";
import { Suspense } from "react";
import { InviteForm } from "@/features/auth/components/invite-form";
import { previewInvite } from "@/features/auth/server/accounts";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = { title: "Lời mời – Góc Bộ Tộc", robots: { index: false, follow: false } };

// Cache Components needs at least one param at build time; every real token is
// unknown then and renders on request (the invite is checked against the database).
export async function generateStaticParams() {
  return [{ token: "_" }];
}

const ROLE: Record<string, string> = { owner: "chủ trang", admin: "quản trị viên", official: "tài khoản chính chủ (✓ Chính chủ + quản trị)" };

export default function InvitePage({ params }: PageProps<"/moi/[token]">) {
  return (
    <div className="mx-auto max-w-md py-10">
      <Suspense fallback={<p className="text-sm text-muted">Đang kiểm tra lời mời…</p>}>
        <Invite params={params} />
      </Suspense>
    </div>
  );
}

/** Dynamic: the token is checked against the database on every request. */
async function Invite({ params }: { params: PageProps<"/moi/[token]">["params"] }) {
  const { token } = await params;
  const invite = isSupabaseConfigured ? await previewInvite(token) : null;
  if (!invite) {
    return (
      <Card className="p-5 text-sm">
        <h1 className="text-lg font-bold">Link mời không dùng được</h1>
        <p className="mt-2 text-muted">Link đã được dùng, đã hết hạn hoặc không đúng. Nhờ người gửi tạo link mới nhé.</p>
      </Card>
    );
  }
  return (
    <Card className="space-y-4 p-5">
      <div>
        <p className="font-script text-2xl font-semibold text-accent-glow">Thiệp mời Bộ Tộc</p>
        <h1 className="mt-1 text-xl font-black">Chào {invite.displayName}!</h1>
        <p className="mt-2 text-sm text-muted">
          Bạn được mời làm <strong className="text-foreground">{ROLE[invite.role]}</strong> của Góc Bộ Tộc. Tên đăng nhập của bạn là{" "}
          <strong className="font-mono text-foreground">{invite.handleKey}</strong>. Trang không cần email, số điện thoại hay tài khoản Google: bạn chỉ cần tự
          đặt một mã khóa — không ai khác biết mã này. Link dùng được một lần, hết hạn lúc{" "}
          {new Date(invite.expiresAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.
        </p>
      </div>
      <InviteForm token={token} handle={invite.handleKey} />
    </Card>
  );
}
