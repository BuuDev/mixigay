"use client";

import Image from "next/image";
import { startTransition, useEffect, useRef, useState, ViewTransition } from "react";
import { useOverlayFlag } from "@/shared/hooks/use-overlay-flag";
import { AnimatePresence, duration, ease, m, spring } from "@/shared/motion";
import { IconClose } from "@/shared/ui/icons";
import { Portal } from "@/shared/ui/portal";
import type { AlbumPhoto } from "../lib/photos";

// Resting tilt of each polaroid once the stack has fanned out.
const TILT = [-6, 4, -3, 7, -5, 3];
const shareName = (p: AlbumPhoto) => `album-${p.id}`;

/**
 * Wedding-album style: the photos arrive as one stack and fan out into polaroids
 * when the block scrolls into view. Tapping one morphs that photo into the lightbox
 * (React <ViewTransition> shared element) and closing morphs it back; arrow keys,
 * swipe and Esc work inside. Browsers without View Transitions just swap instantly;
 * reduced motion turns every animation off (motion.css + MotionConfig).
 */
export function PhotoAlbum({ photos }: { photos: AlbumPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  // Opening/closing runs in a Transition so the shared-element morph fires.
  const show = (i: number | null) => startTransition(() => setOpen(i));
  const close = () => {
    const from = open;
    show(null);
    // Focus goes back to the polaroid now showing (prev/next may have moved it).
    if (from !== null) triggers.current[from]?.focus({ preventScroll: true });
  };

  return (
    <>
      <m.ul
        className="mx-auto grid max-w-4xl grid-cols-2 gap-x-5 gap-y-8 px-4 sm:grid-cols-3 sm:gap-8 sm:px-8 max-sm:[&>li:last-child:nth-child(odd)]:col-span-2 max-sm:[&>li:last-child:nth-child(odd)]:mx-auto max-sm:[&>li:last-child:nth-child(odd)]:w-[calc(50%-0.625rem)]"
        initial="stacked"
        whileInView="spread"
        viewport={{ once: true, margin: "0px 0px -20% 0px" }}
      >
        {photos.map((p, i) => (
          <m.li
            key={p.id}
            variants={{
              stacked: { opacity: 0, y: 60, x: `${((photos.length - 1) / 2 - i) * 60}%`, rotate: 0, scale: 0.9 },
              spread: { opacity: 1, y: 0, x: 0, rotate: TILT[i % TILT.length], scale: 1, transition: { ...spring.soft, delay: 0.12 * i } },
            }}
            whileHover={{ rotate: 0, scale: 1.04, zIndex: 2 }}
          >
            <button
              ref={(el) => {
                triggers.current[i] = el;
              }}
              type="button"
              onClick={() => show(i)}
              className="flex h-full w-full flex-col rounded-sm bg-[#f3e9d7] p-2 pb-4 text-left shadow-[0_12px_30px_-10px_rgb(0_0_0/0.7)] focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={`Mở ảnh: ${p.caption}`}
            >
              {/* Only one element may carry the name: while this photo is open, the lightbox has it. */}
              {open === i ? (
                <Thumb photo={p} />
              ) : (
                <ViewTransition name={shareName(p)} share="td-morph" default="none">
                  <Thumb photo={p} />
                </ViewTransition>
              )}
              <span className="mt-2 line-clamp-2 min-h-[2lh] font-script text-base leading-snug font-semibold text-[#2a2333]">{p.caption}</span>
              <span className="mt-auto block pt-0.5 text-[11px] leading-snug text-[#4a4257]">{p.credit}</span>
            </button>
          </m.li>
        ))}
      </m.ul>
      <p className="mt-6 text-center text-xs text-muted">
        Ảnh sưu tầm từ cộng đồng Bộ Tộc. Bạn là tác giả và muốn được ghi tên hoặc gỡ ảnh? Xem trang Giới thiệu.
      </p>
      <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={close} />
    </>
  );
}

function Thumb({ photo }: { photo: AlbumPhoto }) {
  return (
    <span className="relative block aspect-[4/5] overflow-hidden bg-neutral-800">
      <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 640px) 14rem, 45vw" className="object-cover object-top" />
    </span>
  );
}

function Lightbox({ photos, index, onIndex, onClose }: { photos: AlbumPhoto[]; index: number | null; onIndex: (i: number) => void; onClose: () => void }) {
  const open = index !== null;
  const touchX = useRef<number | null>(null);
  const [dir, setDir] = useState(1);
  useOverlayFlag(open);

  // Prev/next is a plain state update (no Transition), so it slides with Motion
  // instead of morphing; only open and close morph.
  const go = (step: number) => {
    if (index === null) return;
    setDir(step);
    onIndex((index + step + photos.length) % photos.length);
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

  const photo = index === null ? null : photos[index];
  if (!photo) return null;
  return (
    <Portal>
      {/* Not inside AnimatePresence: an exit animation would keep the named photo mounted and break the morph back. */}
      <ViewTransition enter="td-fade-in" exit="td-fade-out" default="none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Album anh Độ"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background/95 p-4 backdrop-blur"
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
          <figure className="flex max-h-full flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* The named boundary is never keyed or inside AnimatePresence: prev/next only renames it,
                so the exiting slide never carries a second copy of a name. */}
            <ViewTransition name={shareName(photo)} share="td-morph" default="none">
              <div className="grid">
                <AnimatePresence initial={false} custom={dir}>
                  <m.div
                    key={photo.id}
                    className="col-start-1 row-start-1 flex justify-center"
                    initial={{ opacity: 0, x: 40 * dir, rotate: 2 * dir }}
                    animate={{ opacity: 1, x: 0, rotate: 0, transition: { duration: duration.slow, ease: ease.out } }}
                    exit={{ opacity: 0, x: -40 * dir, transition: { duration: duration.fast } }}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes="90vw"
                      className="max-h-[70svh] w-auto rounded-md object-contain shadow-2xl"
                    />
                  </m.div>
                </AnimatePresence>
              </div>
            </ViewTransition>
            <figcaption className="mt-3 text-center text-sm">
              {photo.caption}
              <span className="block text-xs text-muted">{photo.credit}</span>
            </figcaption>
          </figure>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => go(-1)} className="min-h-11 min-w-11 rounded-pill hover:text-foreground" aria-label="Ảnh trước">
              ←
            </button>
            <span aria-live="polite">
              {(index ?? 0) + 1} / {photos.length}
            </span>
            <button type="button" onClick={() => go(1)} className="min-h-11 min-w-11 rounded-pill hover:text-foreground" aria-label="Ảnh sau">
              →
            </button>
          </div>
        </div>
      </ViewTransition>
    </Portal>
  );
}
