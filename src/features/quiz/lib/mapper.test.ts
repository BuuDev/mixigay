import { describe, expect, it } from "vitest";
import { mapQuizQuestion } from "./mapper";

describe("mapQuizQuestion", () => {
  it("maps valid DB row to QuizQuestion", () => {
    const q = mapQuizQuestion({
      id: "q-1",
      question: "Câu hỏi thử nghiệm dài hơn 10 ký tự?",
      option_a: "A",
      option_b: "B",
      option_c: "C",
      option_d: "D",
      correct_index: 2,
      explanation: "Vì C đúng",
      author_name: "Fan Cứng",
      approved: true,
      created_at: "2026-11-08T00:00:00Z",
    });
    expect(q).not.toBeNull();
    expect(q?.correctIndex).toBe(2);
    expect(q?.options).toEqual(["A", "B", "C", "D"]);
  });

  it("returns null if correct_index is out of bounds", () => {
    const q = mapQuizQuestion({
      id: "q-bad",
      question: "Câu hỏi thử nghiệm?",
      option_a: "A",
      option_b: "B",
      option_c: "C",
      option_d: "D",
      correct_index: 9,
      explanation: null,
      author_name: "Fan",
      approved: true,
      created_at: "2026-11-08T00:00:00Z",
    });
    expect(q).toBeNull();
  });
});

