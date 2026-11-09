import { describe, expect, it } from "vitest";
import { evaluateQuizRank, STARTER_QUIZ_QUESTIONS } from "./quiz";

describe("STARTER_QUIZ_QUESTIONS", () => {
  it("has valid 4-option multiple choice questions with correctIndex in 0..3", () => {
    expect(STARTER_QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(5);
    for (const q of STARTER_QUIZ_QUESTIONS) {
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
      expect(q.question.length).toBeGreaterThanOrEqual(10);
    }
  });
});

describe("evaluateQuizRank", () => {
  it("returns S+ rank for high scores", () => {
    expect(evaluateQuizRank(6, 6).badge).toBe("Hạng S+");
  });

  it("returns A rank for medium scores", () => {
    expect(evaluateQuizRank(4, 6).badge).toBe("Hạng A");
  });

  it("returns rookie rank for low scores", () => {
    expect(evaluateQuizRank(1, 6).badge).toBe("Mầm non");
  });
});

