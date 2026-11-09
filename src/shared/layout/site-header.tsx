"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "../ui/brand-art";
import { cn } from "../ui/cn";
import { isActive, NAV } from "./nav";

/** App chrome. `account` is a slot so this client component never imports server code. */
export function SiteHeader({ account }: { account?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-safe py-2.5">
        <Link href="/" className="shrink-0" aria-label="Góc Bộ Tộc – trang chủ">
          <Logo height={28} />
        </Link>
        <nav aria-label="Điều hướng chính" className="-mx-1 hidden min-w-0 flex-1 gap-1 overflow-x-auto px-1 text-sm [scrollbar-width:none] lg:flex">
          {NAV.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-pill px-3 py-1.5 transition-colors duration-150",
                  active ? "bg-accent text-background" : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto shrink-0">{account}</div>
      </div>
    </header>
  );
}
