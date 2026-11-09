import type { ReactNode } from "react";
import { Illustration, type IllustrationName } from "./brand-art";

export function EmptyState({ art, title, children }: { art: IllustrationName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <Illustration name={art} width={200} />
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}
