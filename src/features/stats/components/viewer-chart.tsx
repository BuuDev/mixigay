"use client";

import { useId, useState, type PointerEvent } from "react";
import { formatViews } from "@/shared/lib/format";
import { nearestIndex, niceTicks, seriesPath, timeTicks } from "../lib/chart";
import { formatCount, formatElapsed } from "../lib/vn-time";
import type { StreamSeries } from "../types";

// The plot is drawn in a fixed box and stretched to the container
// (preserveAspectRatio="none" + non-scaling strokes); every label and marker is
// HTML positioned in percent, so text never distorts at 390 / 768 / 1366 px.
const W = 1000;
const H = 300;

const pct = (n: number) => `${Math.min(100, Math.max(0, n))}%`;

/** Viewers over time for one stream. Mouse/touch shows the reading under the pointer; the table below carries the data for screen readers. */
export function ViewerChart({ stream }: { stream: StreamSeries }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const { points } = stream;
  const xMax = Math.max(1, stream.durationMinutes, points.at(-1)?.minute ?? 0);
  const yTicks = niceTicks(stream.peakViewers);
  const yMax = yTicks[yTicks.length - 1];
  const xTicks = timeTicks(xMax);
  const x = (m: number) => (m / xMax) * 100;
  const y = (v: number) => (1 - v / yMax) * 100;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.width) return;
    setHover(nearestIndex(points, ((e.clientX - box.left) / box.width) * xMax));
  };

  const active = hover !== null && hover >= 0 ? points[hover] : null;
  const peakX = x(stream.peakMinute);
  const peakY = y(stream.peakViewers);

  return (
    <div className="relative h-60 pb-7 pl-11 sm:h-72 sm:pl-12">
      {/* Y axis labels */}
      <div aria-hidden className="absolute top-0 bottom-7 left-0 w-10 sm:w-11">
        {yTicks.map((t) => (
          <span key={t} className="absolute right-1 -translate-y-1/2 text-xs text-muted tabular-nums" style={{ top: pct(y(t)) }}>
            {formatViews(t)}
          </span>
        ))}
      </div>

      <div className="relative size-full touch-pan-y" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          role="img"
          aria-label={`Biểu đồ số người xem theo thời gian: đông nhất ${formatCount(stream.peakViewers)} người ở phút ${formatElapsed(stream.peakMinute)}, trung bình ${formatCount(stream.avgViewers)} người.`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--td-ember)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--td-ember)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {yTicks.map((t) => (
            <line key={t} x1={0} x2={W} y1={(y(t) / 100) * H} y2={(y(t) / 100) * H} stroke="var(--td-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <path d={seriesPath(points, xMax, yMax, W, H, true)} fill={`url(#${gradientId})`} />
          <path
            d={seriesPath(points, xMax, yMax, W, H)}
            fill="none"
            stroke="var(--td-ember)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Peak marker with a direct label */}
        <span
          aria-hidden
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-background bg-accent-glow"
          style={{ left: pct(peakX), top: pct(peakY) }}
        />
        <span
          aria-hidden
          className="absolute rounded-sm bg-background/90 px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-accent-glow tabular-nums"
          style={{
            left: pct(peakX),
            top: pct(peakY),
            transform: `translate(${peakX > 70 ? "calc(-100% - 8px)" : "8px"}, ${peakY < 12 ? "4px" : "calc(-100% - 4px)"})`,
          }}
        >
          Đỉnh {formatCount(stream.peakViewers)}
        </span>

        {active && (
          <>
            <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-foreground/40" style={{ left: pct(x(active.minute)) }} />
            <span
              aria-hidden
              className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-foreground"
              style={{ left: pct(x(active.minute)), top: pct(y(active.viewers)) }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute top-1 rounded-md border border-border bg-surface-raised px-2 py-1 text-xs whitespace-nowrap shadow-card tabular-nums"
              style={{ left: pct(x(active.minute)), transform: `translateX(${x(active.minute) > 60 ? "calc(-100% - 8px)" : "8px"})` }}
            >
              <span className="text-muted">Phút {formatElapsed(active.minute)}</span> · <strong>{formatCount(active.viewers)}</strong> người xem
            </span>
          </>
        )}
      </div>

      {/* X axis labels: elapsed time since the stream started */}
      <div aria-hidden className="absolute right-0 bottom-0 left-11 h-6 sm:left-12">
        {xTicks.map((t, i) => (
          <span
            key={t}
            className="absolute top-1 text-xs text-muted tabular-nums"
            style={{ left: pct(x(t)), transform: i === 0 ? undefined : x(t) > 94 ? "translateX(-100%)" : "translateX(-50%)" }}
          >
            {formatElapsed(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
