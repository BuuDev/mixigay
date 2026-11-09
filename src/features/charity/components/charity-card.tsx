"use client";

import { daysUntilAnnual, isCharityMonth } from "@/features/events/lib/events";
import { useNow } from "@/shared/hooks/use-now";
import { OFFICIAL_CHANNEL_URL } from "@/shared/lib/links";
import { m, rise, stagger } from "@/shared/motion";
import { Card } from "@/shared/ui/card";
import { CHARITY_DISCLAIMER, CHARITY_MILESTONES } from "../lib/milestones";

const container = stagger(0.07);

/**
 * "Góp Gạch Xây Trường": a countdown to the December charity month and a
 * timeline of sourced milestones. Honour roll only — no donations, no account numbers.
 */
export function CharityCard() {
  const now = useNow();
  const inMonth = now ? isCharityMonth(now) : false;
  const days = now ? daysUntilAnnual(12, 1, now).days : null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-accent/10 p-5 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">Truyền thống tháng 12</p>
        {inMonth ? (
          <p className="mt-2 text-2xl font-black">Đang là tháng Góp Gạch Xây Trường 🧱</p>
        ) : (
          <p className="mt-2 text-2xl font-black">
            Còn <span className="font-mono text-4xl text-accent">{days ?? "--"}</span> ngày tới tháng Góp Gạch Xây Trường
          </p>
        )}
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          Cộng đồng Bộ Tộc cùng Đoàn Thanh niên trường ĐH Kinh tế Quốc dân xây điểm trường, nhà công vụ cho trẻ em vùng cao — theo dõi trên{" "}
          <a href={OFFICIAL_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            kênh chính chủ
          </a>
          .
        </p>
      </div>
      <m.ol variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative space-y-4 p-5 pl-10">
        <span aria-hidden className="absolute top-6 bottom-6 left-5 w-px bg-border" />
        {CHARITY_MILESTONES.map((ms) => (
          <m.li key={ms.when + ms.title} variants={rise} className="relative">
            <span aria-hidden className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--td-ember)]" />
            <p className="text-xs font-semibold text-accent">{ms.when}</p>
            <p className="font-bold">{ms.title}</p>
            <p className="text-sm text-muted">
              {ms.detail}{" "}
              <a href={ms.source.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                {ms.source.label} ↗
              </a>
            </p>
          </m.li>
        ))}
      </m.ol>
      <p className="border-t border-border p-4 text-center text-xs text-muted">{CHARITY_DISCLAIMER}</p>
    </Card>
  );
}
