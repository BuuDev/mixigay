"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { QUOTE_MIN } from "../lib/limits";
import { resolveMoment } from "../lib/moment";
import type { Quote, QuoteVideoOption } from "../types";
import { draftReady, EMPTY_DRAFT, maxSecondsFrom, QuoteFields, type QuoteDraft } from "./quote-fields";
import { MyQuotes, QuoteEmpty } from "./quote-list";

/** Mock mode (no Supabase): no quotes are invented; what the visitor types only lives in this browser tab. */
export function QuoteDemo({ videos }: { videos: QuoteVideoOption[] }) {
  const [mine, setMine] = useState<Quote[]>([]);
  const [draft, setDraft] = useState<QuoteDraft>(EMPTY_DRAFT);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const moment = resolveMoment(draft, maxSecondsFrom(videos));
    if (!moment.ok || !draftReady(draft, videos, QUOTE_MIN)) return;
    const title = videos.find((v) => v.videoId === moment.videoId)?.title ?? null;
    setMine((prev) => [
      {
        id: crypto.randomUUID(),
        body: draft.body.trim(),
        videoId: moment.videoId,
        videoTitle: title,
        atSeconds: moment.atSeconds,
        author: "bạn",
        authorVerified: false,
        createdAt: new Date().toISOString(),
        approved: false,
      },
      ...prev,
    ]);
    setDraft(EMPTY_DRAFT);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <section aria-labelledby="quote-list-heading" className="space-y-6">
        <h2 id="quote-list-heading" className="sr-only">
          Quote đã duyệt
        </h2>
        <QuoteEmpty />
        <MyQuotes
          title="Quote demo của bạn"
          note="Chế độ demo (chưa nối Supabase): quote chỉ lưu tạm trên trình duyệt này, không ai khác thấy và không được duyệt."
          quotes={mine}
          badge="Chế độ demo"
        />
      </section>
      <Card className="self-start p-4">
        <form onSubmit={submit} className="space-y-3">
          <h2 className="font-semibold">Gửi một quote</h2>
          <p className="text-xs text-muted">Chế độ demo (chưa nối Supabase): quote chỉ lưu tạm trên trình duyệt.</p>
          <QuoteFields videos={videos} draft={draft} onChange={setDraft} />
          <Button type="submit" disabled={!draftReady(draft, videos, QUOTE_MIN)} className="w-full">
            Gửi quote (demo)
          </Button>
        </form>
      </Card>
    </div>
  );
}
