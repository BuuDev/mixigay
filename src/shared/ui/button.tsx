import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";
const variants: Record<ButtonVariant, string> = {
  // Brand rule: ember is for the primary action; never a large background.
  primary: "bg-accent text-background hover:bg-accent-glow",
  secondary: "border border-border bg-surface text-foreground hover:border-accent",
  ghost: "text-muted hover:text-foreground",
};
const sizes: Record<ButtonSize, string> = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5", lg: "px-5 py-3 text-lg" };

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

/**
 * Link styled as a button. `external` links (YouTube, official shop…) open in a
 * new tab with rel="noopener noreferrer" and an ↗ marker, per the brand rules.
 */
export function ButtonLink({
  href,
  external = false,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  external?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  const cls = buttonClass(variant, size, className);
  if (!external) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
      <span aria-hidden>↗</span>
      <span className="sr-only">(mở tab mới)</span>
    </a>
  );
}
