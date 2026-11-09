"use client";

import { useState } from "react";
import { AnimatePresence, m, pop } from "@/shared/motion";
import { BottomSheet } from "@/shared/motion/bottom-sheet";
import { Burst } from "@/shared/motion/burst";
import { Illustration } from "@/shared/ui/brand-art";
import { OFFICIAL_LINKS } from "../links";

/**
 * Spec §6 — gift box: bobs while idle with a "Chạm để mở" hint; a tap pops the
 * lid with confetti, then a sheet slides up listing the official channels.
 * Nothing here collects money: every button leaves for the official page.
 */
export function GiftBox() {
  const [opened, setOpened] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [burst, setBurst] = useState(0);

  function open() {
    setOpened(true);
    setBurst((b) => b + 1);
    setTimeout(() => setSheet(true), 450);
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <button type="button" onClick={open} aria-haspopup="dialog" aria-label="Mở hộp ủng hộ" className="group relative flex flex-col items-center outline-none">
        <span className="relative block">
          <AnimatePresence mode="wait" initial={false}>
            {opened ? (
              <m.span key="open" variants={pop} initial="hidden" animate="visible" className="block">
                <Illustration name="giftbox-open" width={240} />
              </m.span>
            ) : (
              <m.span key="closed" exit={{ scale: 1.08, opacity: 0, transition: { duration: 0.12 } }} className="block motion-safe:animate-td-bob">
                <Illustration name="giftbox-closed" width={240} />
              </m.span>
            )}
          </AnimatePresence>
          {burst > 0 && <Burst key={burst} count={16} distance={110} />}
        </span>
        <span aria-hidden className="-mt-2 h-3 w-32 rounded-[50%] bg-black/50 blur-sm motion-safe:animate-td-shadow" />
        {!opened && <span className="mt-3 text-sm font-semibold text-accent motion-safe:animate-td-hint">Chạm để mở</span>}
      </button>
      {opened && (
        <button type="button" onClick={() => setSheet(true)} className="text-sm text-accent underline-offset-4 hover:underline">
          Xem lại các link chính chủ
        </button>
      )}
      <p className="max-w-sm text-sm text-muted">Trang không nhận tiền. Mọi ủng hộ đi thẳng tới anh Độ qua kênh chính chủ.</p>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Ủng hộ anh Độ – link chính chủ">
        <ul className="space-y-2 text-left">
          {OFFICIAL_LINKS.map((l, i) => (
            <m.li key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * i } }}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-accent"
              >
                <span>
                  <span className="block font-semibold">{l.label}</span>
                  <span className="block text-xs text-muted">{l.hint}</span>
                </span>
                <span aria-hidden className="text-accent">
                  ↗
                </span>
                <span className="sr-only">(mở tab mới)</span>
              </a>
            </m.li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">Góc Bộ Tộc là trang do fan tự làm, không liên kết chính thức và không nhận tiền dưới bất kỳ hình thức nào.</p>
      </BottomSheet>
    </div>
  );
}
