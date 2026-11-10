import type { ReactNode } from "react";

/**
 * Section title with an eyebrow and a glowing "LED strip" underline — the rhythm
 * marker between the one-screen blocks of the home page.
 */
export function SectionHeader({ eyebrow, title, icon, id }: { eyebrow?: string; title: string; icon?: ReactNode; id?: string }) {
  return (
    <header className="mb-5 text-center">
      {eyebrow && <p className="font-script text-xl font-semibold text-accent-glow">{eyebrow}</p>}
      <h2 id={id} className="mt-1 flex items-center justify-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
        {icon}
        {title}
      </h2>
      <div aria-hidden className="mx-auto mt-3 h-0.5 w-20 rounded-pill bg-accent shadow-[0_0_12px_var(--td-ember)]" />
    </header>
  );
}
