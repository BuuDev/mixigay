"use client";

import { useNow } from "@/shared/hooks/use-now";
import { Card } from "@/shared/ui/card";
import { ANNUAL_EVENTS, daysUntilAnnual, OPEN_EVENTS } from "../lib/events";

/**
 * "Radar sự kiện Bộ Tộc": yearly dates counted down in Vietnam days, plus open
 * plans shown only with their status (no invented dates).
 */
export function EventRadar() {
  const now = useNow();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        {ANNUAL_EVENTS.map((e) => {
          const next = now ? daysUntilAnnual(e.month, e.day, now) : null;
          return (
            <Card key={e.id} className="flex items-center gap-4 p-4">
              <div className="w-20 shrink-0 text-center">
                <span className="block font-mono text-4xl leading-none font-black text-transparent [-webkit-text-stroke:1.5px_var(--td-ember)]">
                  {next === null ? "--" : next.days}
                </span>
                <span className="text-xs text-muted">{next?.days === 0 ? "HÔM NAY" : "ngày nữa"}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold">{e.label}</p>
                <p className="text-sm text-muted">
                  {String(e.day).padStart(2, "0")}/{String(e.month).padStart(2, "0")} · {e.note}
                </p>
                <a href={e.source.href} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                  Nguồn: {e.source.label} ↗
                </a>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="p-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Radar hóng kèo — chưa có ngày</p>
        <ul className="mt-3 space-y-3">
          {OPEN_EVENTS.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-accent motion-safe:animate-td-pulse" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{e.label}</p>
                <p className="text-muted">
                  {e.status}{" "}
                  <a href={e.source.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {e.source.label} ↗
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
