"use client";

import type { ReactNode } from "react";
import { m } from "motion/react";
import { rise, stagger } from "./presets";

/**
 * Reveals its content when it scrolls into view (once), like the sections of an
 * e-invitation. With `cascade`, direct <RevealItem> children appear one by one.
 * Server components can be passed as children, so whole sections stay server-rendered.
 */
export function ScrollReveal({ children, cascade = false, className, as = "div" }: { children: ReactNode; cascade?: boolean; className?: string; as?: "div" | "section" }) {
  const Tag = as === "section" ? m.section : m.div;
  return (
    <Tag
      className={className}
      variants={cascade ? stagger(0.08) : rise}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={rise}>
      {children}
    </m.div>
  );
}
