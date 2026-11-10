"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "@/shared/motion";
import { Card } from "@/shared/ui/card";

export interface WallHighlight {
  id: string;
  body: string;
  author: string;
  verified: boolean;
}

const EVERY_MS = 5000;

/** Latest approved wall notes, one at a time with a soft cross-fade; pauses on hover/focus. */
export function WallHighlights({ messages, demo }: { messages: WallHighlight[]; demo: boolean }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false); // hover / focus
  const [held, setHeld] = useState(false); // the "Tạm dừng" button
  useEffect(() => {
    if (reduced || paused || held || messages.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), EVERY_MS);
    return () => clearInterval(id);
  }, [reduced, paused, held, messages.length]);

  if (!messages.length) {
    return (
      <Card className="flex h-full flex-col justify-center gap-2 p-5 text-center">
        <p className="font-semibold">Chưa có lời nhắn nào</p>
        <Link href="/bo-toc#buc-tuong" className="text-sm text-accent hover:underline">
          Viết lời nhắn đầu tiên cho anh Độ →
        </Link>
      </Card>
    );
  }

  const list = reduced ? messages.slice(0, 3) : [messages[i % messages.length]];
  return (
    <Card
      className="flex h-full flex-col gap-3 p-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold">Bức tường Bộ Tộc</h3>
        {demo && <span className="text-xs text-muted">dữ liệu mẫu</span>}
      </div>
      <div className="relative min-h-28 flex-1" aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          {list.map((w) => (
            <m.figure
              key={w.id}
              initial={reduced ? false : { opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduced ? undefined : { opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mb-3"
            >
              <blockquote className="text-lg leading-relaxed font-semibold break-words">“{w.body}”</blockquote>
              <figcaption className="mt-1 text-sm text-muted">
                — <span className="text-accent">{w.author}</span>
                {w.verified && <span className="ml-1 text-cleared">✓ Chính chủ</span>}
              </figcaption>
            </m.figure>
          ))}
        </AnimatePresence>
      </div>
      {!reduced && messages.length > 1 && (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {messages.map((w, n) => (
              <span key={w.id} className={`h-1 flex-1 rounded-pill transition-colors duration-300 ${n === i % messages.length ? "bg-accent" : "bg-border"}`} />
            ))}
          </div>
          {/* WCAG 2.2.2: touch users can stop the rotation too (hover/focus only covers mouse and keyboard). */}
          <button
            type="button"
            aria-pressed={held}
            onClick={() => setHeld((h) => !h)}
            className="min-h-9 rounded-pill border border-border px-3 text-xs text-muted hover:border-accent hover:text-foreground"
          >
            {held ? "Chạy tiếp" : "Tạm dừng"}
          </button>
        </div>
      )}
      <Link href="/bo-toc#buc-tuong" className="text-sm text-accent hover:underline">
        Viết lời nhắn cho anh Độ →
      </Link>
    </Card>
  );
}
