"use client";

import { useState } from "react";
import { AnimatePresence, m, rise } from "@/shared/motion";
import { Badge } from "@/shared/ui/badge";
import { Mascot } from "@/shared/ui/brand-art";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { IconQuote } from "@/shared/ui/icons";
import { nextVibeIndex, TRIBE_VIBES } from "../lib/vibes";

/**
 * Interactive "Góc tự trào Bộ Tộc" card: shows a funny community observation from
 * recent streams and lets the visitor cycle through them. Written in the fan
 * community's voice (never attributing quotes to Độ).
 */
export function TribeVibe() {
  const [index, setIndex] = useState(0);
  const current = TRIBE_VIBES[index] ?? TRIBE_VIBES[0];

  return (
    <Card className="relative overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Mascot pose="hello" size={72} decorative className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent" icon={<IconQuote size={13} />}>
              Chuyện thường ngày ở Bộ Tộc
            </Badge>
            <Badge tone="muted">{current.tag}</Badge>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={current.id} variants={rise} initial="hidden" animate="visible" exit="exit" className="mt-2">
              <p className="text-base leading-relaxed font-semibold text-foreground sm:text-lg">{current.text}</p>
              <p className="mt-1 text-xs text-muted">Nguồn cảm hứng: {current.context}</p>
            </m.div>
          </AnimatePresence>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIndex((i) => nextVibeIndex(i))}
          aria-label="Đổi câu chuyện khác của Bộ Tộc"
          className="shrink-0"
        >
          🎲 Chuyện khác ({index + 1}/{TRIBE_VIBES.length})
        </Button>
      </div>
    </Card>
  );
}

