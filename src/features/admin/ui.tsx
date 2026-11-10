import type { ReactNode } from "react";

// Plain building blocks for the admin area: function over form.

export const input = "rounded-md border border-border bg-background px-2 py-1 text-sm";
export const button = "rounded-md border border-border px-3 py-1 text-sm hover:border-accent";
export const primary = "rounded-md bg-accent px-3 py-1 text-sm font-semibold text-background";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function GameSelect({
  games,
  name = "game",
  value,
  empty = "— chưa gán —",
}: {
  games: { slug: string; name: string }[];
  name?: string;
  value?: string | null;
  empty?: string;
}) {
  return (
    <select name={name} defaultValue={value ?? ""} className={input}>
      <option value="">{empty}</option>
      {games.map((g) => (
        <option key={g.slug} value={g.slug}>
          {g.name}
        </option>
      ))}
    </select>
  );
}
