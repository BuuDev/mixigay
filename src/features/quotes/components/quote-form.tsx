"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { submitQuote } from "../actions";
import { QUOTE_MIN } from "../lib/limits";
import type { QuoteVideoOption } from "../types";
import { draftReady, EMPTY_DRAFT, QuoteFields, type QuoteDraft } from "./quote-fields";

/** Quote form for signed-in fans (Supabase mode). */
export function QuoteForm({ videos }: { videos: QuoteVideoOption[] }) {
  const [result, formAction, pending] = useActionState(submitQuote, null);
  const [draft, setDraft] = useState<QuoteDraft>(EMPTY_DRAFT);

  useEffect(() => {
    if (!result?.ok) return;
    // Clearing the controlled fields after a successful submit, a response to the action result.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(EMPTY_DRAFT);
  }, [result]);

  return (
    <Card className="p-4">
      <form action={formAction} className="space-y-3">
        <h2 className="font-semibold">Gửi một quote</h2>
        <QuoteFields videos={videos} draft={draft} onChange={setDraft} />
        <Button type="submit" disabled={pending || !draftReady(draft, videos, QUOTE_MIN)} className="w-full">
          {pending ? "Đang gửi…" : "Gửi quote"}
        </Button>
        {result && (
          <p role="status" className={cn("text-sm", result.ok ? "text-cleared" : "text-live-text")}>
            {result.message}
          </p>
        )}
        <p className="text-xs text-muted">Tối đa 5 quote mỗi ngày. Quote được duyệt trước khi hiện công khai; mỗi giây của một video chỉ giữ một quote.</p>
      </form>
    </Card>
  );
}
