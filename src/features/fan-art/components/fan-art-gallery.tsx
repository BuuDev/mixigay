"use client";

import { startTransition, useEffect, useRef, useState, ViewTransition } from "react";
import { useOverlayFlag } from "@/shared/hooks/use-overlay-flag";
import { AnimatePresence, duration, ease, m } from "@/shared/motion";
import { IconClose, IconExpand, IconExternal } from "@/shared/ui/icons";
import { Portal } from "@/shared/ui/portal";
import { largeImageUrl } from "../lib/drive";
import type { FanArtItem } from "../types";

const shareName = (art: FanArtItem) => `fan-art-${art.id}`;

/**
 * Fan art grid (COMPONENTS.md §8). Tapping a card morphs its picture into the lightbox
 * (React <ViewTransition> shared element, same pattern as the album) and closing morphs
 * it back; arrow keys, swipe and Esc work inside. Browsers without View Transitions just
 * swap instantly; reduced motion turns every animation off (motion.css + MotionConfig).
 */
export function FanArtGallery({ items }: { items: FanArtItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  // Opening/closing runs in a Transition so the shared-element morph fires.
  const show = (i: number | null) => startTransition(() => setOpen(i));
  const close = () => {
    const from = open;
    show(null);
    // Focus goes back to the card now showing (prev/next may have moved it).
    if (from !== null) triggers.current[from]?.focus({ preventScroll: true });
  };

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((art, i) => (
          <li key={art.id}>
            <button
              ref={(el) => {
                triggers.current[i] = el;
              }}
              type="button"
              onClick={() => show(i)}
              aria-label={`Xem lớn tranh “${art.title}” của ${art.artist}`}
              className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-surface text-left shadow-card transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
            >
              {/* Only one element may carry the name: while this art is open, the lightbox has it. */}
              {open === i ? (
                <Thumb art={art} />
              ) : (
                <ViewTransition name={shareName(art)} share="td-morph" default="none">
                  <Thumb art={art} />
                </ViewTransition>
              )}
              <span className="flex flex-1 flex-col p-4">
                <span className="font-bold text-foreground">{art.title}</span>
                <span className="mt-0.5 text-xs font-medium text-accent">Họa sĩ: {art.artist}</span>
                {art.note && <span className="mt-2 line-clamp-2 text-xs text-muted">{art.note}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox items={items} index={open} onIndex={setOpen} onClose={close} />
    </>
  );
}

function Thumb({ art }: { art: FanArtItem }) {
  return (
    <span className="relative block aspect-[4/3] w-full overflow-hidden bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.imageUrl}
        alt={art.title}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-pill bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
        <IconExpand size={14} aria-hidden />
        Xem lớn
      </span>
    </span>
  );
}

function Lightbox({ items, index, onIndex, onClose }: { items: FanArtItem[]; index: number | null; onIndex: (i: number) => void; onClose: () => void }) {
  const open = index !== null;
  const touchX = useRef<number | null>(null);
  const [dir, setDir] = useState(1);
  useOverlayFlag(open);

  // Prev/next is a plain state update (no Transition), so it slides with Motion
  // instead of morphing; only open and close morph.
  const go = (step: number) => {
    if (index === null || items.length < 2) return;
    setDir(step);
    onIndex((index + step + items.length) % items.length);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const art = index === null ? null : items[index];
  if (!art) return null;
  return (
    <Portal>
      {/* Not inside AnimatePresence: an exit animation would keep the named image mounted and break the morph back. */}
      <ViewTransition enter="td-fade-in" exit="td-fade-out" default="none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Tranh fan art: ${art.title}`}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur"
          onClick={onClose}
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX;
            touchX.current = null;
            if (start != null && end != null && Math.abs(end - start) > 50) go(end < start ? 1 : -1);
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-pill p-3 text-muted hover:text-foreground"
            aria-label="Đóng"
            autoFocus
          >
            <IconClose size={24} />
          </button>
          <figure className="flex max-h-full w-full max-w-3xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* The named boundary is never keyed or inside AnimatePresence: prev/next only renames it,
                so the exiting slide never carries a second copy of a name. */}
            <ViewTransition name={shareName(art)} share="td-morph" default="none">
              <div className="grid">
                <AnimatePresence initial={false} custom={dir}>
                  <m.div
                    key={art.id}
                    className="col-start-1 row-start-1 flex justify-center"
                    initial={{ opacity: 0, x: 40 * dir }}
                    animate={{ opacity: 1, x: 0, transition: { duration: duration.slow, ease: ease.out } }}
                    exit={{ opacity: 0, x: -40 * dir, transition: { duration: duration.fast } }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={largeImageUrl(art.imageUrl, art.driveFileId)}
                      alt={art.title}
                      referrerPolicy="no-referrer"
                      className="max-h-[62svh] w-auto max-w-full rounded-md bg-surface object-contain shadow-2xl"
                    />
                  </m.div>
                </AnimatePresence>
              </div>
            </ViewTransition>
            <figcaption className="mt-3 max-w-prose text-center text-sm">
              <span className="block font-bold text-foreground">{art.title}</span>
              <span className="block text-xs font-medium text-accent">Họa sĩ: {art.artist}</span>
              {art.note && <span className="mt-1.5 block text-xs text-muted">{art.note}</span>}
              <a
                href={art.driveUrl}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-border px-4 text-xs font-semibold text-foreground hover:border-accent"
              >
                <IconExternal size={14} aria-hidden />
                Mở Drive gốc ↗<span className="sr-only"> (mở tab mới)</span>
              </a>
            </figcaption>
          </figure>
          {items.length > 1 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => go(-1)} className="min-h-11 min-w-11 rounded-pill hover:text-foreground" aria-label="Tranh trước">
                ←
              </button>
              <span aria-live="polite">
                {(index ?? 0) + 1} / {items.length}
              </span>
              <button type="button" onClick={() => go(1)} className="min-h-11 min-w-11 rounded-pill hover:text-foreground" aria-label="Tranh sau">
                →
              </button>
            </div>
          )}
        </div>
      </ViewTransition>
    </Portal>
  );
}
