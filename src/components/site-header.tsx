"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/lich", label: "Lịch stream" },
  { href: "/video", label: "Video theo game" },
  { href: "/vlog", label: "Vlog" },
  { href: "/da-choi", label: "Đã chơi" },
  { href: "/de-xuat", label: "Đề xuất game" },
];

export function SiteHeader({ account }: { account?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-4 py-3">
        <Link href="/" className="shrink-0 font-bold">
          Góc Fan Độ
        </Link>
        <nav className="flex gap-1 text-sm">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 ${active ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">{account}</div>
      </div>
    </header>
  );
}
