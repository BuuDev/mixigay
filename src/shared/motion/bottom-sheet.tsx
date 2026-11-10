"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { useOverlayFlag } from "../hooks/use-overlay-flag";
import { Portal } from "../ui/portal";
import { fade, sheet } from "./presets";

/**
 * Modal sheet that slides up from the bottom (centred dialog on wide screens).
 * Escape and the backdrop close it; focus moves in on open and back on close.
 */
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useOverlayFlag(open);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <m.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" variants={fade} initial="hidden" animate="visible" exit="exit" onClick={onClose} />
            <m.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              variants={sheet}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-lg border border-border bg-surface-raised p-5 shadow-card outline-none sm:max-w-md sm:rounded-lg"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-extrabold">{title}</h2>
                <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-pill px-2 text-2xl leading-none text-muted hover:text-foreground">
                  ×
                </button>
              </div>
              {children}
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
