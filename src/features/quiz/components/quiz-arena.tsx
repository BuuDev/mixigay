"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { submitQuizQuestion } from "../actions";
import { evaluateQuizRank } from "../lib/quiz";
import type { QuizQuestion } from "../types";

const field = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export function QuizArena({ questions }: { questions: QuizQuestion[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) return null;
  const current = questions[currentIdx % questions.length];
  const isCorrect = selected !== null && selected === current.correctIndex;

  function chooseOption(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === current.correctIndex) {
      setScore((s) => s + 1);
    }
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
    }
  }

  function restartQuiz() {
    setCurrentIdx(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const rank = evaluateQuizRank(score, questions.length);
    return (
      <Card className="p-6 text-center">
        <Badge tone="accent">{rank.badge}</Badge>
        <h3 className="mt-3 text-2xl font-extrabold">{rank.title}</h3>
        <p className="mt-2 font-mono text-lg font-bold text-accent">
          Đúng {score} / {questions.length} câu hỏi
        </p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{rank.summary}</p>
        <div className="mt-5 flex justify-center">
          <Button type="button" onClick={restartQuiz}>
            Chơi lại từ đầu
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="font-semibold text-accent">
          Câu {currentIdx + 1} / {questions.length}
        </span>
        <span>Đóng góp bởi: {current.authorName}</span>
        <span className="font-mono">Điểm: {score}</span>
      </div>

      <h3 className="text-base font-bold sm:text-lg">{current.question}</h3>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {current.options.map((opt, idx) => {
          const picked = selected === idx;
          const rightOption = selected !== null && idx === current.correctIndex;
          return (
            <button
              key={idx}
              type="button"
              disabled={selected !== null}
              onClick={() => chooseOption(idx)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm font-medium transition-colors",
                selected === null && "border-border bg-background hover:border-accent",
                rightOption && "border-cleared bg-cleared/15 text-foreground",
                picked && !rightOption && "border-live bg-live/15 text-foreground",
                selected !== null && !picked && !rightOption && "border-border/50 bg-background/50 opacity-60",
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-surface font-mono text-xs font-bold">
                {OPTION_LABELS[idx]}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
          <div className="text-xs">
            <p className={cn("font-bold", isCorrect ? "text-cleared" : "text-live-text")}>
              {isCorrect ? "Chính xác! Chuẩn fan cứng Bộ Tộc!" : `Tiếc quá! Đáp án đúng là ${OPTION_LABELS[current.correctIndex]}.`}
            </p>
            {current.explanation && <p className="mt-1 text-muted">{current.explanation}</p>}
          </div>
          <Button type="button" onClick={nextQuestion}>
            {currentIdx + 1 >= questions.length ? "Xem kết quả" : "Câu tiếp theo →"}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function QuizQuestionForm() {
  const [result, action, pending] = useActionState(submitQuizQuestion, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result?.ok) formRef.current?.reset();
  }, [result]);

  return (
    <Card className="p-4">
      <form ref={formRef} action={action} className="space-y-3">
        <h3 className="font-bold">Đóng góp câu hỏi Đố vui Bộ Tộc</h3>
        <p className="text-xs text-muted">
           Gửi câu hỏi vui về kỷ niệm trên sóng của anh Độ Mixi. Câu hỏi sẽ xuất hiện sau khi Admin duyệt.
        </p>

        <label className="block text-sm">
          Câu hỏi
          <input
            name="question"
            required
            minLength={10}
            maxLength={240}
            placeholder="VD: Biệt danh của anh Độ khi chơi Goose Goose Duck là gì?"
            className={field}
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs">
            Đáp án A
            <input name="optionA" required maxLength={120} className={field} />
          </label>
          <label className="block text-xs">
            Đáp án B
            <input name="optionB" required maxLength={120} className={field} />
          </label>
          <label className="block text-xs">
            Đáp án C
            <input name="optionC" required maxLength={120} className={field} />
          </label>
          <label className="block text-xs">
            Đáp án D
            <input name="optionD" required maxLength={120} className={field} />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs">
            Đáp án đúng
            <select name="correctIndex" defaultValue="0" className={field}>
              <option value="0">Đáp án A</option>
              <option value="1">Đáp án B</option>
              <option value="2">Đáp án C</option>
              <option value="3">Đáp án D</option>
            </select>
          </label>
          <label className="block text-xs">
            Tên người đóng góp
            <input name="authorName" maxLength={60} placeholder="Bộ Tộc" className={field} />
          </label>
        </div>

        <label className="block text-xs">
          Giải thích ngắn (tùy chọn)
          <input name="explanation" maxLength={300} placeholder="Gợi nhớ buổi stream hoặc kỷ niệm liên quan…" className={field} />
        </label>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Đang gửi…" : "Gửi câu hỏi"}
        </Button>

        {result && (
          <p role="status" className={cn("text-sm", result.ok ? "text-cleared" : "text-live-text")}>
            {result.message}
          </p>
        )}
      </form>
    </Card>
  );
}

