"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Logo } from "../ui/brand-art";
import { cn } from "../ui/cn";
import { isActive, MORE_GROUPS, NAV } from "./nav";

const PRIMARY = NAV.filter((n) => n.primary);
const MORE = [
  ...NAV.filter((n) => !n.primary),
  { href: "/gioi-thieu", label: "Giới thiệu", group: "tribe" as const, desc: "Trang này là gì, liên hệ gỡ nội dung" },
];
const MENU_WIDTH = 448; // w-md

/**
 * App chrome. `account` is a slot so this client component never imports server code.
 * Six fixed links with short labels leave room for "Quản trị · tên · Thoát"
 * at 1024 px; everything else lives in a two-column "Thêm" menu anchored under its button.
 */
export function SiteHeader({ account }: { account?: ReactNode }) {
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // Anchor the popover under its button (top layer is fixed; CSS anchor positioning isn't everywhere yet).
  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    const place = (e: Event) => {
      if ((e as ToggleEvent).newState !== "open" || !button.current) return;
      const r = button.current.getBoundingClientRect();
      const left = Math.max(16, Math.min(r.left, window.innerWidth - MENU_WIDTH - 16));
      el.style.left = `${left}px`;
      el.style.top = `${r.bottom + 8}px`;
    };
    el.addEventListener("beforetoggle", place);
    return () => el.removeEventListener("beforetoggle", place);
  }, []);

  const moreActive = MORE.some((n) => isActive(n.href, pathname));
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-safe py-2.5">
        <Link href="/" className="shrink-0" aria-label="Góc Bộ Tộc – trang chủ">
          <Logo height={28} />
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden min-w-0 flex-1 items-center gap-1 text-sm lg:flex">
          {PRIMARY.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} short={item.short} active={isActive(item.href, pathname)} />
          ))}
          <button
            ref={button}
            type="button"
            popoverTarget="header-more"
            className={cn(
              "shrink-0 rounded-pill px-2.5 py-1.5 transition-colors duration-150 xl:px-3",
              moreActive ? "bg-accent text-background" : "text-muted hover:text-foreground",
            )}
          >
            Thêm ▾
          </button>
          <div
            ref={menu}
            id="header-more"
            popover="auto"
            className="td-nav-more inset-auto m-0 w-md max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-3 text-sm text-foreground shadow-card"
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {MORE_GROUPS.map((g) => (
                <div key={g.key}>
                  <p className="px-2 pt-1 pb-1.5 text-[11px] font-bold tracking-wider text-accent uppercase">{g.title}</p>
                  <ul>
                    {MORE.filter((n) => n.group === g.key).map((n) => (
                      <li key={n.href}>
                        <Link
                          href={n.href}
                          aria-current={isActive(n.href, pathname) ? "page" : undefined}
                          onClick={() => menu.current?.hidePopover()}
                          className="block rounded-md px-2 py-2 hover:bg-surface-raised aria-[current=page]:text-accent"
                        >
                          <span className="block font-semibold">{n.label}</span>
                          {n.desc && <span className="block text-xs leading-snug text-muted">{n.desc}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </nav>
        <div className="ml-auto shrink-0">{account}</div>
      </div>
    </header>
  );
}

/**
 * Short label at every desktop width: the header container stops growing at 72rem, and
 * full labels ("Video theo game"…) collided with "Quản trị · long name · Thoát". The full
 * label stays available as a tooltip.
 */
function NavLink({ href, label, short, active }: { href: string; label: string; short?: string; active: boolean }) {
  return (
    <Link
      href={href}
      title={short ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-pill px-2.5 py-1.5 whitespace-nowrap transition-colors duration-150 xl:px-3",
        active ? "bg-accent text-background" : "text-muted hover:text-foreground",
      )}
    >
      {short ?? label}
    </Link>
  );
}
