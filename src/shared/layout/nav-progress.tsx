"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Thin bar at the top while a page loads: starts on a click on an internal link, finishes
 * when the URL has changed. No JavaScript is loaded for it beyond this file, and with
 * reduced motion the bar simply appears and disappears (no sliding).
 */
export function NavProgress() {
  const url = `${usePathname()}?${useSearchParams().toString()}`;
  const [loading, setLoading] = useState(false);
  // The URL changed: the new page is on screen (state adjusted during render, not in an effect).
  const [shownUrl, setShownUrl] = useState(url);
  if (shownUrl !== url) {
    setShownUrl(url);
    setLoading(false);
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Capture phase: runs before links that navigate themselves (the /video filters), so they get the bar too.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const to = new URL(a.href, location.href);
      if (to.origin !== location.origin) return;
      if (to.pathname === location.pathname && to.search === location.search) return; // same page / hash link
      setLoading(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Safety net: a click that ends on the same URL (redirect back, cancelled navigation) never
  // changes the URL, so the bar would stay forever.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 10_000);
    return () => clearTimeout(t);
  }, [loading]);

  if (!loading) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div className="h-full origin-left bg-accent shadow-[0_0_8px_var(--td-ember)] motion-safe:animate-td-progress motion-reduce:opacity-80" />
    </div>
  );
}
