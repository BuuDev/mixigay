"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Logo } from "../ui/brand-art";
import { cn } from "../ui/cn";
import { isActive, MORE_GROUPS, NAV, type NavItem } from "./nav";

const PRIMARY = NAV.filter((n) => n.primary);
// "xl" primaries (Bộ Tộc, Lịch) are also listed here, visible only below xl.
const MORE = NAV.filter((n) => n.group && n.primary !== "lg");
const MENU_WIDTH = 448; // w-md

/**
 * App chrome. `account` is a slot so this client component never imports server code.
 * Contribution pages lead the bar. Widths are handled in CSS only (a JS-measured overflow
 * menu broke before): 5 fixed links at lg leave room for "Quản trị · long name · Thoát"
 * at 1024 px, all 7 from xl, full labels from 2xl. The rest lives in a two-column
 * "Thêm" menu anchored under its button.
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

  // On /lich or /bo-toc the "Thêm" button lights up only while those links live inside it.
  const moreActive = MORE.some((n) => !n.primary && isActive(n.href, pathname));
  const moreActiveBelowXl = !moreActive && MORE.some((n) => n.primary && isActive(n.href, pathname));
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-safe py-2.5 2xl:max-w-[88rem]">
        <Link prefetch={false} href="/" className="shrink-0" aria-label="Góc Bộ Tộc – trang chủ">
          <Logo height={28} />
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden min-w-0 flex-1 items-center gap-1 text-sm lg:flex">
          {PRIMARY.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href, pathname)} />
          ))}
          <button
            ref={button}
            type="button"
            popoverTarget="header-more"
            className={cn(
              "shrink-0 rounded-pill px-2.5 py-1.5 transition-colors duration-150 xl:px-3",
              moreActive
                ? "bg-accent text-background"
                : moreActiveBelowXl
                  ? "bg-accent text-background xl:bg-transparent xl:text-muted xl:hover:text-foreground"
                  : "text-muted hover:text-foreground",
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
                      <li key={n.href} className={n.primary ? "xl:hidden" : undefined}>
                        <Link
                          prefetch={false}
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
 * Short label below 2xl: full labels ("Đề xuất game", "Lịch stream") collided with
 * "Quản trị · long name · Thoát"; the full label stays available as a tooltip.
 * Contribution pages get an accent "+" and an accent hover; the active pill stays
 * ember on night (6.5:1) either way.
 */
// Layout links never prefetch (prefetch={false}): on every page view they were ~14 background
// requests (ADR-019). Pages are static on the CDN, so a click still loads fast, with NavProgress.
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, short, contribute } = item;
  return (
    <Link
      prefetch={false}
      href={href}
      title={short ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 items-center rounded-pill px-2.5 py-1.5 whitespace-nowrap transition-colors duration-150 xl:px-3",
        item.primary === "xl" ? "hidden xl:inline-flex" : "inline-flex",
        active ? "bg-accent text-background" : cn("text-muted", contribute ? "hover:text-accent" : "hover:text-foreground"),
      )}
    >
      {contribute && (
        <span aria-hidden="true" className={cn("mr-0.5 text-xs font-black", active ? "text-background" : "text-accent")}>
          +
        </span>
      )}
      {short ? (
        <>
          <span className="2xl:hidden">{short}</span>
          <span className="hidden 2xl:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </Link>
  );
}
