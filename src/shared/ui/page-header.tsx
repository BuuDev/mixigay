import type { ReactNode } from "react";

export function PageHeader({ title, icon, children }: { title: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <div className="space-y-1">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {icon}
        {title}
      </h1>
      {children && <p className="max-w-prose text-sm text-muted">{children}</p>}
    </div>
  );
}
