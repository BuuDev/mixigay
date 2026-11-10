"use client";

import { useEffect, useState, type CSSProperties } from "react";

// Ember particles rising behind the page (spec §10). Pure CSS animation (motion.css);
// this component only lays out the particles and switches itself off when the
// device reports a low battery. Hidden entirely under prefers-reduced-motion.

/** Deterministic pseudo-random in [0,1) per index, so server and client markup match. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type BatteryManager = { level: number; charging: boolean };

export function Embers({ count = 15, live = false }: { count?: number; live?: boolean }) {
  const [lowBattery, setLowBattery] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    nav
      .getBattery?.()
      .then((b) => setLowBattery(!b.charging && b.level < 0.2))
      .catch(() => {});
  }, []);

  if (lowBattery) return null;
  const n = Math.min(18, Math.max(12, count));
  return (
    <div className="td-embers" data-live={live} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i
          key={i}
          style={
            {
              "--x": `${Math.round(rand(i, 1) * 100)}%`,
              "--d": `${(7 + rand(i, 2) * 6).toFixed(1)}s`,
              "--delay": `${(-rand(i, 3) * 10).toFixed(1)}s`,
              "--sway": `${Math.round(10 + rand(i, 4) * 30) * (i % 2 ? -1 : 1)}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
