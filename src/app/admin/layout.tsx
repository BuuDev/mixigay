import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { requireAdmin } from "@/features/auth/server/viewer";

export const metadata: Metadata = { title: "Quản trị – Góc Bộ Tộc", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/lich", label: "Lịch" },
  { href: "/admin/video", label: "Video" },
  { href: "/admin/game", label: "Game & từ khóa" },
  { href: "/admin/de-xuat", label: "Đề xuất" },
  { href: "/admin/da-choi", label: "Đã chơi" },
  { href: "/admin/nhac", label: "Nhạc nịnh" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Đang kiểm tra quyền…</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2 text-sm">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="rounded-full border border-border px-3 py-1 hover:border-accent">
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
