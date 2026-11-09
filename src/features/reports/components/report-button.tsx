"use client";

import { useId, useRef, useState, useTransition } from "react";
import { reportContent, type ReportResult } from "../actions";
import { REASON_LABEL, REASONS, type ReportKind, type ReportReason } from "../lib/reasons";

/**
 * "Báo cáo" link that opens a native popover of reasons (light dismiss, Esc and focus
 * return come from the browser). Optionally also lets the fan report the author's
 * display name. Demo mode (no backend) shows a note instead of calling the server.
 */
export function ReportButton({ kind, targetId, authorId, demo = false }: { kind: ReportKind; targetId: string; authorId?: string; demo?: boolean }) {
  const id = useId().replace(/:/g, "");
  const panel = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<ReportResult>();
  const [pending, start] = useTransition();

  function send(k: ReportKind, target: string, reason: ReportReason) {
    panel.current?.hidePopover();
    if (demo) {
      setResult({ ok: true, message: "Chế độ demo: báo cáo không được gửi đi." });
      return;
    }
    start(async () => setResult(await reportContent(k, target, reason)));
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        popoverTarget={`report-${id}`}
        disabled={pending}
        className="min-h-6 rounded-sm text-xs text-muted underline underline-offset-2 hover:text-foreground disabled:opacity-60"
      >
        {pending ? "Đang gửi…" : "Báo cáo"}
      </button>
      <div
        ref={panel}
        id={`report-${id}`}
        popover="auto"
        className="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-3 text-sm text-foreground shadow-card backdrop:bg-background/60"
      >
        <p className="font-semibold">Báo cáo nội dung này vì…</p>
        <ul className="mt-2 space-y-1">
          {REASONS.map((r) => (
            <li key={r}>
              <button type="button" onClick={() => send(kind, targetId, r)} className="block min-h-11 w-full rounded-md px-3 text-left hover:bg-surface-raised">
                {REASON_LABEL[r]}
              </button>
            </li>
          ))}
          {authorId && (
            <li className="border-t border-border pt-1">
              <button
                type="button"
                onClick={() => send("profile", authorId, "offensive")}
                className="block min-h-11 w-full rounded-md px-3 text-left hover:bg-surface-raised"
              >
                Tên người gửi phản cảm
              </button>
            </li>
          )}
        </ul>
        <button
          type="button"
          popoverTarget={`report-${id}`}
          popoverTargetAction="hide"
          className="mt-2 min-h-11 w-full rounded-md text-muted hover:text-foreground"
        >
          Thôi
        </button>
      </div>
      {result && (
        <span role="status" className={result.ok ? "text-xs text-cleared" : "text-xs text-live-text"}>
          {result.message}
        </span>
      )}
    </span>
  );
}
