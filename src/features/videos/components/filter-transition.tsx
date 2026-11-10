"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useState, useTransition, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/shared/ui/cn";

// The /video filters are plain links (they work without JavaScript and can be shared).
// With JavaScript, a click runs the navigation in a transition so the old cards stay on
// screen, dimmed under a shimmer, while the clicked chip shows a spinner until the new
// page of cards arrives.

interface FilterNav {
  pending: boolean;
  /** href being loaded, so only the clicked chip spins. */
  target: string | null;
  go: (href: string) => void;
}

const Ctx = createContext<FilterNav>({ pending: false, target: null, go: () => {} });

export function FilterTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<string | null>(null);
  const go = (href: string) => {
    setTarget(href);
    start(() => router.push(href, { scroll: false }));
  };
  return <Ctx value={{ pending, target: pending ? target : null, go }}>{children}</Ctx>;
}

const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** A filter link that loads in place; modified clicks (new tab) keep the browser default. */
export function FilterLink({
  href,
  className,
  children,
  ...rest
}: { href: string; className?: string; children: ReactNode } & Omit<ComponentProps<"a">, "href" | "onClick">) {
  const { target, go } = use(Ctx);
  const loading = target === href;
  return (
    <a
      {...rest}
      href={href}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (!isPlainClick(e)) return;
        e.preventDefault();
        go(href);
      }}
      className={cn("relative", className)}
    >
      {children}
      {/* Pinned to the corner so the chip never changes width (no layout shift). */}
      {loading && (
        <span aria-hidden className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-background">
          <span className="size-3 rounded-full border-2 border-accent border-t-transparent motion-safe:animate-td-spin" />
        </span>
      )}
    </a>
  );
}

/** Wraps the results: dims them under a moving sheen while a filter loads. */
export function FilterResults({ children }: { children: ReactNode }) {
  const { pending } = use(Ctx);
  return (
    <div aria-busy={pending || undefined} className="relative">
      <div className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50")}>{children}</div>
      {pending && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-foreground/10 to-transparent motion-safe:animate-td-shimmer" />
        </div>
      )}
      <p role="status" className="sr-only">
        {pending ? "Đang tải video…" : ""}
      </p>
    </div>
  );
}
