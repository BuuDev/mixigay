"use client";

import { AnimatePresence, m, pop } from "@/shared/motion";

/** "Có thể đã có rồi" — nudges fans to upvote instead of duplicating. */
export function SimilarHint({ items }: { items: { key: string; label: string }[] }) {
  return (
    <AnimatePresence>
      {items.length > 0 && (
        <m.div variants={pop} initial="hidden" animate="visible" exit="exit" className="rounded-md bg-accent/10 p-2 text-xs">
          Có thể đã có rồi:
          <ul className="mt-1 list-disc pl-4">
            {items.map((s) => (
              <li key={s.key}>{s.label}</li>
            ))}
          </ul>
          Nếu trùng, upvote thay vì tạo mới nhé.
        </m.div>
      )}
    </AnimatePresence>
  );
}
