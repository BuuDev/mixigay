"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { submitQuizLink } from "../actions";
import { QUIZ_DESCRIPTION_MAX, QUIZ_PLATFORM_LABEL, QUIZ_PLATFORM_LIST, QUIZ_TITLE_MAX, QUIZ_TITLE_MIN, quizPlatform } from "../lib/quiz-url";

interface Draft {
  title: string;
  url: string;
  description: string;
}

const EMPTY: Draft = { title: "", url: "", description: "" };
const field = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2";
const chars = (s: string) => [...s.trim()].length;

/** Quiz link form for signed-in fans. Controlled fields: React 19 clears uncontrolled ones after every action. */
export function QuizLinkForm() {
  const [result, formAction, pending] = useActionState(submitQuizLink, null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const ids = { url: useId(), title: useId(), description: useId() };

  useEffect(() => {
    if (!result?.ok) return;
    // Clearing the controlled fields after a successful submit, a response to the action result.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(EMPTY);
  }, [result]);

  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setDraft({ ...draft, [k]: e.target.value });
  const url = draft.url.trim();
  const platform = url ? quizPlatform(url) : null;
  const titleLength = chars(draft.title);
  const descriptionLength = chars(draft.description);
  const ready = platform !== null && titleLength >= QUIZ_TITLE_MIN && titleLength <= QUIZ_TITLE_MAX && descriptionLength <= QUIZ_DESCRIPTION_MAX;

  return (
    <Card className="p-4">
      <form action={formAction} className="space-y-3">
        <h3 className="font-semibold">Gửi link quiz của bạn</h3>
        <label className="block text-sm">
          Link quiz
          <input
            name="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            required
            value={draft.url}
            onChange={set("url")}
            aria-describedby={ids.url}
            placeholder="https://wordwall.net/…"
            className={field}
          />
          <span id={ids.url} className={cn("mt-1 block text-xs", platform ? "text-cleared" : url ? "text-live-text" : "text-muted")}>
            {platform
              ? `Nền tảng: ${QUIZ_PLATFORM_LABEL[platform]}`
              : url
                ? `Chưa nhận link này: chỉ nhận ${QUIZ_PLATFORM_LIST}, bắt đầu bằng https://.`
                : `Nhận link ${QUIZ_PLATFORM_LIST}.`}
          </span>
        </label>
        <label className="block text-sm">
          Tên quiz
          <input
            name="title"
            autoComplete="off"
            required
            value={draft.title}
            onChange={set("title")}
            aria-describedby={ids.title}
            placeholder="VD: Bạn nhớ series nào của anh Độ?"
            className={field}
          />
          <span id={ids.title} className={cn("mt-1 block text-right font-mono text-xs", titleLength > QUIZ_TITLE_MAX ? "text-live-text" : "text-muted")}>
            {titleLength}/{QUIZ_TITLE_MAX}
          </span>
        </label>
        <label className="block text-sm">
          Mô tả ngắn (không bắt buộc)
          <textarea name="description" rows={2} value={draft.description} onChange={set("description")} aria-describedby={ids.description} className={field} />
          <span
            id={ids.description}
            className={cn("mt-1 block text-right font-mono text-xs", descriptionLength > QUIZ_DESCRIPTION_MAX ? "text-live-text" : "text-muted")}
          >
            {descriptionLength}/{QUIZ_DESCRIPTION_MAX}
          </span>
        </label>
        <Button type="submit" disabled={pending || !ready} className="w-full">
          {pending ? "Đang gửi…" : "Gửi link quiz"}
        </Button>
        {result && (
          <p role="status" className={cn("text-sm", result.ok ? "text-cleared" : "text-live-text")}>
            {result.message}
          </p>
        )}
        <p className="text-xs text-muted">
          Tối đa 3 link mỗi ngày. Admin mở thử từng link rồi mới duyệt; nhớ bật chế độ ai có link cũng chơi được. Câu hỏi về người thật chỉ nên dựa trên điều
          anh Độ đã nói hoặc làm trên sóng.
        </p>
      </form>
    </Card>
  );
}
