import type { ComponentProps } from "react";
import { cn } from "./cn";

export function Card({ className, raised = false, ...props }: ComponentProps<"div"> & { raised?: boolean }) {
  return (
    <div
      className={cn("rounded-lg border border-border shadow-card", raised ? "bg-surface-raised" : "bg-surface", className)}
      {...props}
    />
  );
}
