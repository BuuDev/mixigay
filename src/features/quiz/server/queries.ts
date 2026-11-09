import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapQuizQuestion, type QuizQuestionRow } from "../lib/mapper";
import { STARTER_QUIZ_QUESTIONS } from "../lib/quiz";
import type { QuizQuestion } from "../types";

/** Approved fan-contributed quiz questions merged with curated starter questions. */
export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  "use cache";
  cacheTag(TAGS.quiz);
  cacheLife("hours");
  if (!isSupabaseConfigured) return STARTER_QUIZ_QUESTIONS;
  const rows = check<QuizQuestionRow[]>(
    await publicClient()
      .from("quiz_questions")
      .select("id,question,option_a,option_b,option_c,option_d,correct_index,explanation,author_name,approved,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(100),
    "quiz_questions",
  );
  const fanQuestions = rows.map(mapQuizQuestion).filter((q): q is QuizQuestion => q !== null);
  return [...fanQuestions, ...STARTER_QUIZ_QUESTIONS];
}

