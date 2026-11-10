import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { requireAdmin } from "@/features/auth/server/viewer";
import { KIND_LIST } from "@/features/moderation/lib/kinds";
import { getPendingCounts, totalPending, type PendingCounts } from "@/features/moderation/server/inbox";

export const metadata: Metadata = { title: "Quản trị – Góc Bộ Tộc", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/duyet", label: "Hộp duyệt" },
  { href: "/admin/nguoi-dung", label: "Người dùng" },
  { href: "/admin/nhat-ky", label: "Nhật ký" },
  { href: "/admin/tu-khoa", label: "Từ khóa chặn" },
  { href: "/admin/lich", label: "Lịch" },
  { href: "/admin/video", label: "Video" },
  { href: "/admin/game", label: "Game & từ khóa" },
  { href: "/admin/de-xuat", label: "Đề xuất" },
  { href: "/admin/binh-chon", label: "Bình chọn" },
  { href: "/admin/da-choi", label: "Đã chơi" },
  { href: "/admin/nhac", label: "Nhạc nịnh" },
  { href: "/admin/fan-art", label: "Tranh Fan Art" },
  { href: "/admin/quiz", label: "Link quiz" },
  { href: "/admin/tuong", label: "Bức tường" },
  { href: "/admin/quote", label: "Kho quote" },
  { href: "/admin/tu-dien", label: "Từ điển" },
  { href: "/admin/giai-dau", label: "Giải đấu" },
  { href: "/admin/skin", label: "Skin theo dịp" },
  { href: "/admin/quan-tri", label: "Quản trị viên" },
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
      {/* Counts are per-request admin data: streamed in, never cached. */}
      <Suspense fallback={<AdminNav />}>
        <AdminNavWithCounts />
      </Suspense>
      {children}
    </div>
  );
}

async function AdminNavWithCounts() {
  return <AdminNav counts={await getPendingCounts()} />;
}

/** Pending count shown on a nav link: the inbox total, or the kind whose admin page it is. */
function countFor(href: string, counts: PendingCounts): number {
  if (href === "/admin/duyet") return totalPending(counts);
  const kind = KIND_LIST.find((k) => k.adminHref === href);
  return kind ? counts[kind.kind] : 0;
}

function AdminNav({ counts }: { counts?: PendingCounts }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      {NAV.map((n) => {
        const count = counts ? countFor(n.href, counts) : 0;
        return (
          <Link key={n.href} href={n.href} className="rounded-full border border-border px-3 py-1 hover:border-accent">
            {n.label}
            {count > 0 && (
              <span className="ml-1.5 rounded-full bg-accent px-1.5 text-xs font-semibold text-background tabular-nums">
                {count}
                <span className="sr-only"> chờ duyệt</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
