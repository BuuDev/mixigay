"use client";

import { useEffect, useState } from "react";
import { button } from "@/features/admin/ui";
import { cn } from "@/shared/ui/cn";
import { setPreviewTheme } from "../lib/dom";
import { THEME_LABELS, THEMES, type Theme } from "../types";

const OPTIONS: { value: Theme | null; label: string }[] = [{ value: null, label: "Mặc định" }, ...THEMES.map((t) => ({ value: t, label: THEME_LABELS[t] }))];

/** Try a skin on this admin page only: leaving the page (unmount) puts the scheduled skin back. */
export function SkinPreview() {
  const [current, setCurrent] = useState<Theme | null | undefined>(undefined);
  useEffect(() => () => setPreviewTheme(undefined), []);

  const pick = (value: Theme | null | undefined) => {
    setCurrent(value);
    setPreviewTheme(value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.label}
          type="button"
          aria-pressed={current === o.value}
          onClick={() => pick(o.value)}
          className={cn(button, current === o.value && "border-accent text-accent")}
        >
          Xem thử: {o.label}
        </button>
      ))}
      <button type="button" onClick={() => pick(undefined)} disabled={current === undefined} className={cn(button, "disabled:text-muted")}>
        Thôi xem thử
      </button>
    </div>
  );
}
