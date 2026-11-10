"use client";

import { AnimatePresence, m, press } from "@/shared/motion";
import { cn } from "@/shared/ui/cn";
import { IconUpvote } from "@/shared/ui/icons";

/** Upvote toggle; the count rolls up/down when it changes. */
export function VoteButton({ name, count, voted, onVote }: { name: string; count: number; voted: boolean; onVote: () => void }) {
  return (
    <m.button
      type="button"
      onClick={onVote}
      {...press}
      aria-pressed={voted}
      className={cn(
        "flex w-14 shrink-0 flex-col items-center self-start rounded-md border py-1.5 text-sm transition-colors",
        voted ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground",
      )}
    >
      <IconUpvote size={18} />
      <span className="sr-only">Upvote {name}:</span>
      <span className="relative h-5 overflow-hidden font-semibold tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={count}
            className="block"
            initial={{ y: voted ? 12 : -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: voted ? -12 : 12, opacity: 0 }}
          >
            {count}
          </m.span>
        </AnimatePresence>
      </span>
    </m.button>
  );
}
