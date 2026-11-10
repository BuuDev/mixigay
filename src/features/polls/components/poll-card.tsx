"use client";

import { useRef, useState } from "react";
import { useNow } from "@/shared/hooks/use-now";
import { AnimatePresence, m, rise, useInView } from "@/shared/motion";
import { Burst } from "@/shared/motion/burst";
import { CountUp } from "@/shared/motion/count-up";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";
import { IconCleared, IconCountdown, IconTribe } from "@/shared/ui/icons";
import { usePoll } from "../hooks/use-poll";
import { isPollOpen, leaderIds, timeLeftLabel, totalVotes, votePercents } from "../lib/results";
import type { Poll, PollViewer } from "../types";
import { PollOptionRow } from "./poll-option-row";

const number = new Intl.NumberFormat("vi-VN");

const DEMO_NOTE = "Dữ liệu mẫu: chưa kết nối máy chủ. Số phiếu chỉ để minh họa, phiếu của bạn chỉ lưu trong tab này.";

export interface PollCardProps {
  /** From getPollBoard() (cached). */
  poll: Poll;
  /** From getMyPollVote(poll.id) (per request). */
  viewer: PollViewer;
  /** "demo" when Supabase is not configured: local-only voting, labelled as sample data. */
  mode: "live" | "demo";
  /** Optional: the last closed poll, shown as a one-line "lần trước" result under an open poll. */
  previous?: Poll | null;
  /** Heading level of the question, to fit the page outline. Default 2. */
  headingLevel?: 2 | 3;
  className?: string;
}

/**
 * "Bình chọn của Bộ Tộc": the question, options as buttons, and animated result bars
 * once the viewer has voted (guests and closed polls see results read-only). Results
 * stay hidden until you vote, so the first pick is your own and not the crowd's.
 */
export function PollCard({ poll, viewer, mode, previous, headingLevel = 2, className }: PollCardProps) {
  const now = useNow("minute");
  const { options, mine, pending, notice, canWrite, choose } = usePoll({ poll, viewer, mode });
  const [celebrate, setCelebrate] = useState(0);

  // Before the clock is known (SSR), trust the status; the DB refuses late votes anyway.
  const open = now ? isPollOpen(poll, now) : poll.status === "open";
  const left = now && open ? timeLeftLabel(poll.closesAt, now) : null;
  const total = totalVotes(options);
  const percents = votePercents(options.map((o) => o.votes));
  const leaders = leaderIds(options);
  const showResults = !open || mine !== null || !canWrite;
  const interactive = open && canWrite;
  const chosen = options.find((o) => o.id === mine);
  const Heading = headingLevel === 3 ? "h3" : "h2";

  function onChoose(id: string) {
    if (choose(id) && mine === null) setCelebrate((c) => c + 1);
  }

  return (
    <section
      aria-label="Bình chọn của Bộ Tộc"
      className={cn("relative overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-card sm:p-6", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-script text-xl text-accent">Bình chọn của Bộ Tộc</p>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "demo" && <Badge tone="misc">Dữ liệu mẫu</Badge>}
          {open ? <Badge tone="accent">Đang mở</Badge> : <Badge tone="muted">Đã đóng</Badge>}
        </div>
      </div>

      <Heading className="mt-2 text-xl font-bold text-balance sm:text-2xl">{poll.question}</Heading>

      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <IconTribe size={18} className="text-accent" />
          <span>
            <CountUp value={total} format={(n) => number.format(Math.round(n))} className="font-semibold text-foreground tabular-nums" /> phiếu
          </span>
        </span>
        {left && (
          <span className="inline-flex items-center gap-1.5">
            <IconCountdown size={18} />
            {left}
          </span>
        )}
      </p>

      {!open && <Winner options={options} leaders={leaders} percents={percents} />}

      <div aria-live="polite" className="mt-4">
        <ul className="space-y-2">
          {options.map((o, i) => (
            <li key={o.id} className="relative">
              <PollOptionRow
                label={o.label}
                votes={o.votes}
                percent={percents[i]}
                showResults={showResults}
                selected={o.id === mine}
                leader={showResults && leaders.includes(o.id)}
                interactive={interactive}
                onChoose={() => onChoose(o.id)}
              />
              {celebrate > 0 && o.id === mine && <Burst key={celebrate} count={10} distance={60} />}
            </li>
          ))}
        </ul>

        <div className="mt-3 min-h-6 text-sm">
          <AnimatePresence mode="wait" initial={false}>
            {chosen ? (
              <m.p
                key={`mine-${chosen.id}`}
                variants={rise}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-wrap items-center gap-x-3 gap-y-1"
              >
                <span>
                  Bạn đã chọn <strong className="text-accent">{chosen.label}</strong>
                </span>
                {interactive && (
                  <>
                    <span className="text-muted">Đổi ý thì bấm lựa chọn khác.</span>
                    <button
                      type="button"
                      onClick={() => choose(null)}
                      disabled={pending}
                      className="min-h-6 text-muted underline underline-offset-2 hover:text-foreground disabled:cursor-wait"
                    >
                      Rút phiếu
                    </button>
                  </>
                )}
              </m.p>
            ) : interactive ? (
              <m.p key="hint" variants={rise} initial="hidden" animate="visible" exit="exit" className="text-muted">
                Bấm một lựa chọn để bình chọn. Kết quả hiện ra sau khi bạn chọn.
              </m.p>
            ) : null}
          </AnimatePresence>
        </div>

        {notice && (
          <p role="status" className="mt-2 text-sm text-live-text">
            {notice}
          </p>
        )}
      </div>

      {open && !canWrite && (
        <div className="mt-4 rounded-md border border-border bg-surface-raised px-4 py-3 text-sm">
          <p className="font-semibold">Vào Bộ Tộc để bình chọn</p>
          <p className="mt-0.5 text-muted">Bấm “Vào Bộ Tộc” (góc trên bên phải). Chỉ cần tên Bộ Tộc + mã khóa, không cần email.</p>
        </div>
      )}

      {mode === "demo" && <p className="mt-4 text-xs text-muted">{DEMO_NOTE}</p>}

      {previous && previous.id !== poll.id && <PreviousResult poll={previous} />}
    </section>
  );
}

/** Closed poll: the winner (or a tie), with a small one-shot burst the first time it scrolls into view. */
function Winner({ options, leaders, percents }: { options: Poll["options"]; leaders: string[]; percents: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  if (leaders.length === 0) return <p className="mt-4 text-sm text-muted">Bình chọn đã đóng mà chưa có phiếu nào.</p>;
  const names = options.filter((o) => leaders.includes(o.id)).map((o) => o.label);
  const pct = percents[options.findIndex((o) => o.id === leaders[0])];
  return (
    <div ref={ref} className="relative mt-4 flex items-center gap-3 rounded-md border border-cleared/40 bg-cleared/10 px-4 py-3">
      <span className="relative inline-flex">
        <IconCleared size={28} className="text-cleared" />
        {seen && <Burst count={12} distance={70} />}
      </span>
      <p className="min-w-0">
        {names.length === 1 ? (
          <>
            Bộ Tộc đã chọn <strong className="text-cleared">{names[0]}</strong>
            <span className="text-muted"> · {pct}%</span>
          </>
        ) : (
          <>
            Hòa: <strong className="text-cleared">{names.join(" và ")}</strong>
            <span className="text-muted"> · mỗi lựa chọn {pct}%</span>
          </>
        )}
      </p>
    </div>
  );
}

function PreviousResult({ poll }: { poll: Poll }) {
  const leaders = leaderIds(poll.options);
  if (leaders.length === 0) return null;
  const percents = votePercents(poll.options.map((o) => o.votes));
  const i = poll.options.findIndex((o) => o.id === leaders[0]);
  return (
    <p className="mt-4 border-t border-border pt-3 text-sm text-muted">
      Lần trước, “{poll.question}”: Bộ Tộc chọn <span className="font-semibold text-foreground">{poll.options[i].label}</span>
      {leaders.length > 1 ? " (hòa)" : ""} · {percents[i]}%
    </p>
  );
}
