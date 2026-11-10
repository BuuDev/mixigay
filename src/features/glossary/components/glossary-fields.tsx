"use client";

import { useId } from "react";
import { cn } from "@/shared/ui/cn";
import { MEANING_MAX, MEANING_MIN, TERM_MAX, TERM_MIN, textLength } from "../lib/limits";
import { checkSourceUrl, SOURCE_HINT } from "../lib/source";

export interface GlossaryDraft {
  term: string;
  meaning: string;
  sourceUrl: string;
}

export const EMPTY_DRAFT: GlossaryDraft = { term: "", meaning: "", sourceUrl: "" };

const field = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

/** True when every field passes the same checks the server runs (lengths + source policy). */
export function draftIsValid(d: GlossaryDraft): boolean {
  const term = textLength(d.term);
  const meaning = textLength(d.meaning);
  return term >= TERM_MIN && term <= TERM_MAX && meaning >= MEANING_MIN && meaning <= MEANING_MAX && checkSourceUrl(d.sourceUrl).ok;
}

function Counter({ id, length, max }: { id: string; length: number; max: number }) {
  return (
    <span id={id} className={cn("mt-1 block text-right font-mono text-xs", length > max ? "text-live-text" : "text-muted")}>
      {length}/{max}
    </span>
  );
}

/** Controlled fields (React 19 resets uncontrolled ones after every action, which would lose a long meaning on one bad link). */
export function GlossaryFields({ value, onChange }: { value: GlossaryDraft; onChange: (d: GlossaryDraft) => void }) {
  const id = useId();
  const source = value.sourceUrl.trim() ? checkSourceUrl(value.sourceUrl) : null;
  return (
    <>
      <label className="block text-sm">
        Từ / biệt danh
        <input
          name="term"
          value={value.term}
          onChange={(e) => onChange({ ...value, term: e.target.value })}
          required
          minLength={TERM_MIN}
          aria-describedby={`${id}-term`}
          placeholder="VD: Moi Xoang"
          className={field}
        />
        <Counter id={`${id}-term`} length={textLength(value.term)} max={TERM_MAX} />
      </label>
      <label className="block text-sm">
        Giải nghĩa
        <textarea
          name="meaning"
          value={value.meaning}
          onChange={(e) => onChange({ ...value, meaning: e.target.value })}
          required
          minLength={MEANING_MIN}
          rows={4}
          aria-describedby={`${id}-meaning`}
          placeholder="Từ này xuất hiện ở đâu, nghĩa là gì – chỉ viết điều nguồn nói, gọi lễ phép “anh Độ”."
          className={field}
        />
        <Counter id={`${id}-meaning`} length={textLength(value.meaning)} max={MEANING_MAX} />
      </label>
      <label className="block text-sm">
        Link nguồn
        <input
          name="sourceUrl"
          type="url"
          inputMode="url"
          value={value.sourceUrl}
          onChange={(e) => onChange({ ...value, sourceUrl: e.target.value })}
          required
          aria-describedby={`${id}-source`}
          placeholder="https://www.youtube.com/watch?v=…"
          className={field}
        />
      </label>
      <p id={`${id}-source`} className={cn("text-xs", source && !source.ok ? "text-live-text" : "text-muted")}>
        {source ? (source.ok ? `Nguồn hợp lệ: ${source.label}.` : source.message) : SOURCE_HINT}
      </p>
    </>
  );
}
