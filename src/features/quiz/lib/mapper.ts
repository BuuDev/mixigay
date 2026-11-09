import type { QuizQuestion } from "../types";

export interface QuizQuestionRow {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  explanation: string | null;
  author_name: string;
  approved: boolean;
  created_at: string;
}

export function mapQuizQuestion(r: QuizQuestionRow): QuizQuestion | null {
  if (r.correct_index < 0 || r.correct_index > 3) return null;
  return {
    id: r.id,
    question: r.question,
    options: [r.option_a, r.option_b, r.option_c, r.option_d],
    correctIndex: r.correct_index as 0 | 1 | 2 | 3,
    explanation: r.explanation ?? undefined,
    authorName: r.author_name || "Bộ Tộc",
    createdAt: r.created_at,
  };
}

