"use client";

import { useId } from "react";
import { cn } from "@/shared/ui/cn";
import { WALL_MAX, WALL_MIN, wallLength } from "../lib/limits";

/** Message field with the 0/140 counter (counted like Postgres char_length). */
export function WallTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const counterId = useId();
  const length = wallLength(value);
  return (
    <label className="block text-sm">
      Lời nhắn
      <textarea
        name="body"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={WALL_MIN}
        rows={3}
        aria-describedby={counterId}
        placeholder="VD: Chúc anh Độ buổi sóng tối nay thật vui!"
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
      />
      <span id={counterId} className={cn("mt-1 block text-right font-mono text-xs", length > WALL_MAX ? "text-live-text" : "text-muted")}>
        {length}/{WALL_MAX}
      </span>
    </label>
  );
}
