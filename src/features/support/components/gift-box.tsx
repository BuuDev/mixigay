"use client";

import { useState, type ComponentType } from "react";
import { AnimatePresence, m, pop } from "@/shared/motion";
import { BottomSheet } from "@/shared/motion/bottom-sheet";
import { Burst } from "@/shared/motion/burst";
import { Illustration, SceneArt } from "@/shared/ui/brand-art";
import { cn } from "@/shared/ui/cn";
import { IconCampfire, IconDiscord, IconFacebook, IconKindle, IconShop, IconYoutube, type IconProps } from "@/shared/ui/icons";
import { OFFICIAL_LINKS, type OfficialLink } from "../links";

const TILE_ICON: Record<string, ComponentType<IconProps>> = {
  donate: IconKindle,
  "donate-intl": IconKindle,
  youtube: IconYoutube,
  shop: IconShop,
  fanpage: IconFacebook,
  group: IconFacebook,
  discord: IconDiscord,
};

// Free support (watching on YouTube) leads the tiles, spanning the row; the rest keep their order.
const TILES = [...OFFICIAL_LINKS].sort((a, b) => Number(b.id === "youtube") - Number(a.id === "youtube"));

/**
 * Spec §6 — gift box: bobs while idle with a "Chạm để mở" hint; a tap pops the
 * lid with confetti, then a sheet slides up listing the official channels.
 * Nothing here collects money: every button leaves for the official page.
 * Beside the box the same official links stay visible as tiles, so the section is never
 * just a closed box on an empty screen.
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
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-14">
      <div className="flex flex-col items-center gap-4 text-center">
        <button
          type="button"
          onClick={open}
          aria-haspopup="dialog"
          aria-label="Mở hộp ủng hộ"
          className="group relative flex flex-col items-center outline-none"
        >
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
      </div>

      <div>
        <div className="mb-4 flex items-center gap-4">
          <SceneArt scene="15-ung-ho-support" size={112} sizes="(min-width: 640px) 112px, 80px" className="size-20 shrink-0 sm:size-28" />
          <p className="text-muted">
            Muốn ủng hộ anh Độ thì đi thẳng tới các trang chính chủ dưới đây. Xem video, like và đăng ký kênh cũng là ủng hộ, lại miễn phí.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TILES.map((l) => (
            <li key={l.id} className={cn(l.id === "youtube" && "sm:col-span-2")}>
              <SupportTile link={l} />
            </li>
          ))}
        </ul>
      </div>

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
        <div className="mt-4 flex items-center gap-3">
          <SceneArt scene="15-ung-ho-support" size={72} className="shrink-0" />
          <p className="text-xs text-muted">Góc Bộ Tộc là trang do fan tự làm, không liên kết chính thức và không nhận tiền dưới bất kỳ hình thức nào.</p>
        </div>
      </BottomSheet>
    </div>
  );
}

function SupportTile({ link }: { link: OfficialLink }) {
  const Icon = TILE_ICON[link.id] ?? IconCampfire;
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-card transition-colors duration-150 hover:border-accent"
    >
      <Icon size={26} className="shrink-0 text-accent" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{link.label}</span>
        <span className="block text-xs text-muted">{link.hint}</span>
      </span>
      <span aria-hidden className="text-accent">
        ↗
      </span>
      <span className="sr-only">(mở tab mới)</span>
    </a>
  );
}
