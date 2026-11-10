"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { submitGlossaryEntry } from "../actions";
import { draftIsValid, EMPTY_DRAFT, GlossaryFields, type GlossaryDraft } from "./glossary-fields";

/** Contribution form for signed-in fans (Supabase mode). */
export function GlossaryForm() {
  const [result, formAction, pending] = useActionState(submitGlossaryEntry, null);
  const [draft, setDraft] = useState<GlossaryDraft>(EMPTY_DRAFT);

  useEffect(() => {
    if (!result?.ok) return;
    // Clearing the controlled fields after a successful submit, a response to the action result.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(EMPTY_DRAFT);
  }, [result]);

  return (
    <Card className="p-4">
      <form action={formAction} className="space-y-3">
        <h3 className="font-semibold">Góp từ cho từ điển</h3>
        <GlossaryFields value={draft} onChange={setDraft} />
        <Button type="submit" disabled={pending || !draftIsValid(draft)} className="w-full">
          {pending ? "Đang gửi…" : "Gửi mục từ chờ duyệt"}
        </Button>
        {result && (
          <p role="status" className={cn("text-sm", result.ok ? "text-cleared" : "text-live-text")}>
            {result.message}
          </p>
        )}
        <p className="text-xs text-muted">Tối đa 3 mục từ mỗi ngày. Mục từ được duyệt trước khi hiện công khai; từ trùng mục có sẵn sẽ không hiện.</p>
      </form>
    </Card>
  );
}
