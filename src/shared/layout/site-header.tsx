"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Logo } from "../ui/brand-art";
import { cn } from "../ui/cn";
import { isActive, NAV } from "./nav";

/** App chrome. `account` is a slot so this client component never imports server code. */
export function SiteHeader({ account }: { account?: ReactNode }) {
  const pathname = usePathname();
  const more = useRef<HTMLDivElement>(null);
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-safe py-2.5">
        <Link href="/" className="shrink-0" aria-label="Góc Bộ Tộc – trang chủ">
          <Logo height={28} />
        </Link>
        {/* Desktop: the main destinations inline, everything else under "Thêm" (native popover). */}
        <nav aria-label="Điều hướng chính" className="hidden min-w-0 flex-1 items-center gap-1 text-sm lg:flex">
          {NAV.filter((n) => n.primary).map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} short={item.short} active={isActive(item.href, pathname)} />
          ))}
          <button
            type="button"
            popoverTarget="header-more"
            className={cn(
              "shrink-0 rounded-pill px-3 py-1.5 transition-colors duration-150",
              NAV.some((n) => !n.primary && isActive(n.href, pathname)) ? "bg-accent text-background" : "text-muted hover:text-foreground",
            )}
          >
            Thêm ▾
          </button>
          <div
            ref={more}
            id="header-more"
            popover="auto"
            className="td-nav-more inset-auto top-14 m-0 min-w-44 rounded-lg border border-border bg-surface p-1 text-sm text-foreground shadow-card"
            style={{ right: "max(1rem, calc((100vw - 72rem) / 2 + 1rem))" }}
          >
            <ul>
              {[...NAV.filter((n) => !n.primary), { href: "/gioi-thieu", label: "Giới thiệu" }].map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(n.href, pathname) ? "page" : undefined}
                    onClick={() => more.current?.hidePopover()}
                    className="block rounded-md px-3 py-2.5 hover:bg-surface-raised aria-[current=page]:text-accent"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="ml-auto shrink-0">{account}</div>
      </div>
    </header>
  );
}

/** Short label between lg and xl so the header fits at 1024 px; full label from xl. */
function NavLink({ href, label, short, active }: { href: string; label: string; short?: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-pill px-3 py-1.5 transition-colors duration-150",
        active ? "bg-accent text-background" : "text-muted hover:text-foreground",
      )}
    >
      {short ? (
        <>
          <span className="xl:hidden">{short}</span>
          <span className="hidden xl:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </Link>
  );
}
