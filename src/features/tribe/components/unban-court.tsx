"use client";

import { useState } from "react";
import { AnimatePresence, m, pop, rise } from "@/shared/motion";
import { Badge } from "@/shared/ui/badge";
import { Mascot } from "@/shared/ui/brand-art";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { composeUnbanPlea, UNBAN_OFFENSES, UNBAN_STYLES } from "../lib/unban";

/**
 * Interactive "Tòa Án Bộ Tộc – Máy Tạo Văn Mẫu Hối Lỗi Xin Unban":
 * visitors pick their "offense" + "apology style" to generate a humorous plea
 * and receive a playful mock verdict from Cú Đêm.
 */
export function UnbanCourt() {
  const [name, setName] = useState("");
  const [offenseId, setOffenseId] = useState<string>(UNBAN_OFFENSES[0].id);
  const [styleId, setStyleId] = useState<string>(UNBAN_STYLES[1].id);
  const [roll, setRoll] = useState(0);
  const [copied, setCopied] = useState(false);

  const plea = composeUnbanPlea({ applicantName: name, offenseId, styleId, roll });

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(plea.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be blocked in restricted contexts; ignore gracefully.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <Card className="space-y-4 p-4 sm:p-5">
        <div>
          <Badge tone="accent">Phiên tòa ân xá giả lập</Badge>
          <h3 className="mt-2 text-lg font-extrabold">Khai báo hồ sơ “Ra đảo”</h3>
          <p className="mt-1 text-xs text-muted">Trình tạo văn mẫu giải trí lấy cảm hứng từ những buổi đọc đơn xin unban đầy nước mắt của anh em Bộ tộc.</p>
        </div>

        <label className="block text-sm font-medium">
          Tên chiến thần ngoài đảo (tuỳ chọn)
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="VD: Robinson_YenLang_99"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <div>
          <p className="text-sm font-medium">1. Chọn lý do bị tiễn ra đảo</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {UNBAN_OFFENSES.map((o) => (
              <Chip key={o.id} active={offenseId === o.id} onClick={() => setOffenseId(o.id)}>
                {o.badge}: {o.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">2. Chọn trường phái viết tâm thư</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {UNBAN_STYLES.map((s) => (
              <Chip key={s.id} active={styleId === s.id} onClick={() => setStyleId(s.id)}>
                {s.badge} · {s.label}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <span className="font-mono text-xs tracking-wider text-muted uppercase">Bản thảo đơn xin về bờ</span>
            <Badge tone={plea.verdict.approved ? "cleared" : "danger"}>Mức cảm động: {plea.verdict.mercyScore}%</Badge>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <m.pre
              key={`${offenseId}-${styleId}-${roll}-${name}`}
              variants={rise}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-3 max-h-72 overflow-y-auto rounded-md border border-border bg-background/70 p-3 font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground"
            >
              {plea.body}
            </m.pre>
          </AnimatePresence>
        </div>

        <div className="mt-4 space-y-3 border-t border-border pt-3">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={`${plea.verdict.approved}-${plea.verdict.mercyScore}-${roll}`}
              variants={pop}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3 rounded-md border border-border bg-surface-raised p-3"
            >
              <Mascot pose={plea.verdict.approved ? "win" : "sad"} size={56} decorative className="shrink-0" />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-extrabold tracking-wide text-accent uppercase">{plea.verdict.stampLabel}</p>
                <p className="mt-0.5 text-muted">{plea.verdict.judgeNote}</p>
              </div>
            </m.div>
          </AnimatePresence>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={copyLetter}>
              {copied ? "✓ Đã chép văn mẫu" : "📋 Sao chép đơn"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setRoll((r) => r + 1)}>
              ⚖️ Xin xét xử lại
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
