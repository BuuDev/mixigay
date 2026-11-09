import type { CSSProperties } from "react";

const COLORS = ["var(--td-ember)", "var(--td-ember-glow)", "var(--td-cream)", "var(--td-viewer)", "var(--td-cleared)"];

/**
 * One-shot particle burst (confetti / sparks), pure CSS. Re-mount with a new `key`
 * to fire again. Place inside a `relative` parent; hidden under reduced motion.
 */
export function Burst({ count = 12, distance = 90 }: { count?: number; distance?: number }) {
  return (
    <span className="td-burst" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={
            {
              "--angle": `${Math.round((360 / count) * i + (i % 2 ? 9 : -9))}deg`,
              "--dist": `${Math.round(distance * (0.7 + ((i * 37) % 30) / 100))}px`,
              "--c": COLORS[i % COLORS.length],
              animationDelay: `${(i % 3) * 30}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
