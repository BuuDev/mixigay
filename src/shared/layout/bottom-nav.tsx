"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ComponentType } from "react";
import { cn } from "../ui/cn";
import { IconCampfire, IconMore, IconSchedule, IconSuggest, IconVlog, type IconProps } from "../ui/icons";
import { isActive, NAV } from "./nav";

const ICONS: Record<string, ComponentType<IconProps>> = { "/": IconCampfire, "/lich": IconSchedule, "/video": IconVlog, "/de-xuat": IconSuggest };

/**
 * Phone navigation in thumb reach (hidden from lg up, where the header shows every
 * link). "Thêm" is a native popover: light-dismiss, Esc and focus return for free.
 * Hidden while a full-screen overlay is open (motion.css, `.td-bottom-nav`).
 */
export function BottomNav() {
  const pathname = usePathname();
  const more = useRef<HTMLDivElement>(null);
  const tabs = NAV.filter((n) => n.tab);
  const rest = NAV.filter((n) => !n.tab);
  const restActive = rest.some((n) => isActive(n.href, pathname));

  return (
    <nav
      aria-label="Thanh tab"
      className="td-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-safe">
        {tabs.map((n) => {
          const Icon = ICONS[n.href];
          const active = isActive(n.href, pathname);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-accent" : "text-muted")}
              >
                {Icon && <Icon size={24} />}
                {n.short ?? n.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            popoverTarget="nav-more"
            className={cn(
              "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              restActive ? "text-accent" : "text-muted",
            )}
          >
            <IconMore size={24} />
            Thêm
            {restActive && <span className="sr-only">(trang đang xem nằm trong đây)</span>}
          </button>
        </li>
      </ul>
      <div
        ref={more}
        id="nav-more"
        popover="auto"
        className="td-nav-more inset-auto right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] m-0 min-w-44 rounded-lg border border-border bg-surface p-1 text-sm text-foreground shadow-card"
      >
        <ul>
          {rest.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={isActive(n.href, pathname) ? "page" : undefined}
                onClick={() => more.current?.hidePopover()}
                className="block rounded-md px-3 py-3 aria-[current=page]:text-accent hover:bg-surface-raised"
              >
                {n.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/gioi-thieu"
              aria-current={isActive("/gioi-thieu", pathname) ? "page" : undefined}
              onClick={() => more.current?.hidePopover()}
              className="block rounded-md px-3 py-3 text-muted hover:bg-surface-raised aria-[current=page]:text-accent"
            >
              Giới thiệu
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
