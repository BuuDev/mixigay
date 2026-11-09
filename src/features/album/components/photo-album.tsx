"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useOverlayFlag } from "@/shared/hooks/use-overlay-flag";
import { AnimatePresence, duration, ease, m, spring } from "@/shared/motion";
import { IconClose } from "@/shared/ui/icons";
import { Portal } from "@/shared/ui/portal";
import type { AlbumPhoto } from "../lib/photos";

// Resting tilt of each polaroid once the stack has fanned out.
const TILT = [-6, 4, -3, 7, -5, 3];

/**
 * Wedding-album style: the photos arrive as one stack and fan out into polaroids
 * when the block scrolls into view; tapping one opens a lightbox (arrow keys,
 * swipe, Esc). Reduced motion: the cards simply appear.
 */
export function PhotoAlbum({ photos }: { photos: AlbumPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <m.ul
        className="mx-auto grid max-w-4xl grid-cols-2 gap-x-5 gap-y-8 px-4 sm:grid-cols-3 sm:gap-8 sm:px-8"
        initial="stacked"
        whileInView="spread"
        viewport={{ once: true, margin: "0px 0px -20% 0px" }}
      >
        {photos.map((p, i) => (
          <m.li
            key={p.id}
            custom={i}
            variants={{
              stacked: {
                opacity: 0,
                y: 60,
                x: `${((photos.length - 1) / 2 - i) * 60}%`,
                rotate: 0,
                scale: 0.9,
              },
              spread: {
                opacity: 1,
                y: 0,
                x: 0,
                rotate: TILT[i % TILT.length],
                scale: 1,
                transition: { ...spring.soft, delay: 0.12 * i },
              },
            }}
            whileHover={{ rotate: 0, scale: 1.04, zIndex: 2 }}
          >
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="block w-full rounded-sm bg-[#f3e9d7] p-2 pb-8 text-left shadow-[0_12px_30px_-10px_rgb(0_0_0/0.7)] focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={`Mở ảnh: ${p.caption}`}
            >
              <span className="relative block aspect-[4/5] overflow-hidden bg-neutral-800">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 640px) 14rem, 45vw"
                  className="object-cover object-top"
                />
              </span>
              <span className="mt-2 block font-[cursive] text-xs leading-snug text-[#2a2333]">
                {p.caption}
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-[#2a2333]/60">
                {p.credit}
              </span>
            </button>
          </m.li>
        ))}
      </m.ul>
      <p className="mt-6 text-center text-xs text-muted">
        Ảnh sưu tầm từ cộng đồng Bộ Tộc. Bạn là tác giả và muốn được ghi tên
        hoặc gỡ ảnh? Xem trang Giới thiệu.
      </p>
      <Lightbox photos={photos} index={open} onIndex={setOpen} />
    </>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
}: {
  photos: AlbumPhoto[];
  index: number | null;
  onIndex: (i: number | null) => void;
}) {
  const open = index !== null;
  const touchX = useRef<number | null>(null);
  const [dir, setDir] = useState(1);
  useOverlayFlag(open);

  const go = (step: number) => {
    if (index === null) return;
    setDir(step);
    onIndex((index + step + photos.length) % photos.length);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const photo = index === null ? null : photos[index];
  return (
    <Portal>
      <AnimatePresence>
        {photo && (
          <m.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Album anh Độ"
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background/95 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: duration.base } }}
            exit={{ opacity: 0, transition: { duration: duration.fast } }}
            onClick={() => onIndex(null)}
            onTouchStart={(e) =>
              (touchX.current = e.touches[0]?.clientX ?? null)
            }
            onTouchEnd={(e) => {
              const start = touchX.current;
              const end = e.changedTouches[0]?.clientX;
              touchX.current = null;
              if (start != null && end != null && Math.abs(end - start) > 50)
                go(end < start ? 1 : -1);
            }}
          >
            <button
              type="button"
              onClick={() => onIndex(null)}
              className="absolute top-4 right-4 rounded-pill p-2 text-muted hover:text-foreground"
              aria-label="Đóng"
              autoFocus
            >
              <IconClose size={24} />
            </button>
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <m.figure
                key={photo.id}
                custom={dir}
                className="flex max-h-full flex-col items-center"
                initial={{ opacity: 0, x: 40 * dir, rotate: 2 * dir }}
                animate={{
                  opacity: 1,
                  x: 0,
                  rotate: 0,
                  transition: { duration: duration.slow, ease: ease.out },
                }}
                exit={{
                  opacity: 0,
                  x: -40 * dir,
                  transition: { duration: duration.fast },
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes="90vw"
                  className="max-h-[75svh] w-auto rounded-md object-contain shadow-2xl"
                />
                <figcaption className="mt-3 text-center text-sm">
                  {photo.caption}
                  <span className="block text-xs text-muted">
                    {photo.credit}
                  </span>
                </figcaption>
              </m.figure>
            </AnimatePresence>
            <div
              className="mt-4 flex items-center gap-4 text-sm text-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded-pill px-3 py-1 hover:text-foreground"
                aria-label="Ảnh trước"
              >
                ←
              </button>
              <span aria-live="polite">
                {(index ?? 0) + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() => go(1)}
                className="rounded-pill px-3 py-1 hover:text-foreground"
                aria-label="Ảnh sau"
              >
                →
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
