import type { ReactNode } from "react";
import { cn } from "./cn";

/** Neon-sign lettering that flickers now and then; steady under reduced motion. */
export function NeonText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-black tracking-wide text-accent-glow [text-shadow:0_0_4px_var(--td-ember-glow),0_0_14px_var(--td-ember)] motion-safe:animate-td-neon", className)}>
      {children}
    </span>
  );
}
