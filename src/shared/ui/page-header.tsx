import type { ReactNode } from "react";

/**
 * Page title + optional lead line. `art` (one `Mascot`/`SceneArt` with a fixed size)
 * sits to the right from `sm` up and is hidden on phones, so it never shifts the layout.
 */
export function PageHeader({ title, icon, children, art }: { title: string; icon?: ReactNode; children?: ReactNode; art?: ReactNode }) {
  const text = (
    <div className="min-w-0 space-y-1">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {icon}
        {title}
      </h1>
      {children && <p className="max-w-prose text-sm text-muted">{children}</p>}
    </div>
  );
  if (!art) return text;
  return (
    <div className="flex items-center justify-between gap-6">
      {text}
      <div className="hidden shrink-0 sm:block">{art}</div>
    </div>
  );
}
