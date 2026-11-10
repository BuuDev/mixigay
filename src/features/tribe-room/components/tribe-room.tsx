"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m, pop, spring, useReducedMotion } from "@/shared/motion";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { useTribeRoom } from "../hooks/use-tribe-room";
import type { TribeRoomStatus } from "../hooks/use-tribe-room";
import {
  ANNOUNCE_EVERY_MS,
  announcement,
  canFloat,
  combo,
  COMBO_WINDOW_MS,
  comboLabel,
  COUNTER_WINDOW_MS,
  floatPath,
  REACTIONS,
  reactionOf,
  tally,
} from "../lib/reactions";
import type { ReactionEvent, ReactionId } from "../lib/reactions";
import { FloatingLayer, type Floater } from "./floating-layer";
import { PresenceDot } from "./presence-dot";
import { Ticker } from "./ticker";

/** Re-evaluate the "last minute" counters this often when nothing new arrives. */
const COUNTER_TICK_MS = 5_000;
const COMBO_SHOW_MS = 1_400;
const COOLDOWN_HINT_MS = 1_600;

function Headline({ online, status }: { online: number | null; status: TribeRoomStatus }) {
  if (online !== null) {
    return (
      <>
        <Ticker value={online} className="tabular-nums" /> người Bộ Tộc đang ở đây
        <span className="sr-only"> (đếm theo tab đang mở)</span>
      </>
    );
  }
  if (status === "connecting" || status === "idle" || status === "reconnecting") return <>Đang vào phòng Bộ Tộc…</>;
  return <>Bộ Tộc đang ở đây</>;
}

/**
 * "Bộ Tộc đang ở đây": how many fans have the site open right now, and reactions that
 * float up on everyone's screen at once. Ephemeral (Supabase Realtime Presence +
 * Broadcast), no sign-in, nothing stored. `live` = anh Độ is streaming right now.
 */
export function TribeRoom({ live = false, className, headingLevel = 2 }: { live?: boolean; className?: string; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const reduce = useReducedMotion();
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [comboState, setComboState] = useState<{ key: string; label: string } | null>(null);
  const [cooling, setCooling] = useState(false);
  const [tick, setTick] = useState<number | null>(null);
  const [spoken, setSpoken] = useState("");

  const floatersRef = useRef<Floater[]>([]);
  const recent = useRef<ReactionEvent[]>([]);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const coolTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reduceRef = useRef(reduce);
  useEffect(() => {
    reduceRef.current = reduce;
  }, [reduce]);

  const removeFloater = useCallback((key: number) => {
    if (!floatersRef.current.some((f) => f.key === key)) return;
    floatersRef.current = floatersRef.current.filter((f) => f.key !== key);
    setFloaters(floatersRef.current);
  }, []);

  const onReaction = useCallback(
    (e: ReactionEvent) => {
      // Combo: same reaction many times inside one second (own taps + everyone else's).
      recent.current = [...recent.current.filter((x) => x.at > e.at - COMBO_WINDOW_MS), e];
      const c = combo(recent.current, e.at);
      if (c) {
        setComboState({ key: `${c.id}-${c.count}`, label: comboLabel(c) });
        clearTimeout(comboTimer.current);
        comboTimer.current = setTimeout(() => setComboState(null), COMBO_SHOW_MS);
      }
      // Floating layer: never under reduced motion, never in a hidden tab, at most MAX_FLOATERS.
      if (reduceRef.current || document.visibilityState === "hidden" || !canFloat(floatersRef.current.length)) return;
      const path = floatPath();
      const f: Floater = { key: e.seq, emoji: reactionOf(e.id).emoji, path, own: e.own };
      floatersRef.current = [...floatersRef.current, f];
      setFloaters(floatersRef.current);
      // Fallback in case the animation never completes (tab switched mid-flight).
      setTimeout(() => removeFloater(f.key), path.duration * 1000 + 600);
    },
    [removeFloater],
  );

  const room = useTribeRoom(onReaction);
  const { online, status, events } = room;

  // Counters decay over the last minute even when nothing new arrives.
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), COUNTER_TICK_MS);
    return () => clearInterval(id);
  }, []);
  const windowEnd = Math.max(tick ?? 0, events.at(-1)?.at ?? 0);
  const minute = tally(events, windowEnd, COUNTER_WINDOW_MS);

  // Screen readers hear a summary at most every ~10 s, never every emoji.
  const latest = useRef({ online, minute });
  useEffect(() => {
    latest.current = { online, minute };
  });
  useEffect(() => {
    const id = setInterval(() => {
      const text = announcement(latest.current.online, latest.current.minute);
      setSpoken((prev) => (prev === text ? prev : text));
    }, ANNOUNCE_EVERY_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(comboTimer.current);
      clearTimeout(coolTimer.current);
    },
    [],
  );

  const tap = (id: ReactionId) => {
    try {
      navigator.vibrate?.(10);
    } catch {
      // vibration is a nicety
    }
    if (room.send(id)) return;
    setCooling(true);
    clearTimeout(coolTimer.current);
    coolTimer.current = setTimeout(() => setCooling(false), COOLDOWN_HINT_MS);
  };

  const demo = status === "demo";
  const offline = status === "off";

  return (
    <Card
      className={cn(
        "relative isolate overflow-hidden p-5 sm:p-6",
        "bg-linear-to-br from-accent/8 via-surface to-surface",
        live && "border-live/60 shadow-[0_0_48px_-12px_var(--td-live)]",
        className,
      )}
    >
      {live && <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-40 w-3/4 -translate-x-1/2 rounded-full bg-live/20 blur-3xl" />}

      <FloatingLayer floaters={floaters} onDone={removeFloater} />

      <div className="relative z-20 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-script text-lg text-accent-glow">Góc nhỏ của anh em</p>
          <Heading className="mt-0.5 flex items-center gap-2.5 text-xl font-bold text-foreground sm:text-2xl" title="Đếm theo số tab đang mở trang">
            <PresenceDot live={live} />
            <span>
              <Headline online={online} status={status} />
            </span>
          </Heading>
          <p className={cn("mt-1 text-sm", live ? "font-semibold text-live-text" : "text-muted")}>
            {live
              ? "Đang live — thả cảm xúc cùng anh em!"
              : demo
                ? "Cảm xúc chỉ hiện trên máy bạn."
                : offline
                  ? "Chưa vào được phòng, cảm xúc tạm thời chỉ hiện trên máy bạn."
                  : "Bấm một cảm xúc, anh em đang mở trang đều thấy ngay."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {demo && <Badge tone="muted">Chế độ demo</Badge>}
          <AnimatePresence>
            {comboState && (
              <m.span
                key={comboState.key}
                variants={pop}
                initial="hidden"
                animate="visible"
                exit="exit"
                aria-hidden
                className="rounded-pill bg-accent/15 px-3 py-1 text-base font-bold text-accent-glow tabular-nums"
              >
                {comboState.label}
              </m.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div role="group" aria-label="Thả cảm xúc" className="relative z-20 mt-5 grid grid-cols-4 gap-2 sm:gap-3">
        {REACTIONS.map((r) => (
          <m.button
            key={r.id}
            type="button"
            onClick={() => tap(r.id)}
            whileTap={{ scale: 0.88 }}
            whileHover={{ y: -2 }}
            transition={spring.bouncy}
            className={cn(
              "flex min-h-24 touch-manipulation flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface-raised/80 px-1 py-2.5",
              "transition-colors duration-150 ease-out hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              live && "border-live/30",
            )}
          >
            <span aria-hidden className="text-3xl leading-none sm:text-4xl">
              {r.emoji}
            </span>
            <span className="text-center text-xs leading-tight font-semibold text-foreground sm:text-sm">{r.label}</span>
            <span className="text-xs text-muted tabular-nums">
              <span className="sr-only">: </span>
              {minute[r.id].toLocaleString("vi-VN")}
              <span className="sr-only"> lượt trong một phút qua</span>
            </span>
          </m.button>
        ))}
      </div>

      <p className="relative z-20 mt-3 min-h-5 text-xs text-muted" aria-live="polite">
        {cooling
          ? "Từ từ thôi anh em, chờ một chút rồi thả tiếp nhé."
          : !room.canSend && !demo && !offline
            ? "Chưa vào Bộ Tộc thì cảm xúc chỉ bay trên máy bạn. Vào Bộ Tộc (góc trên bên phải) để cả phòng cùng thấy."
            : ""}
      </p>
      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
    </Card>
  );
}
