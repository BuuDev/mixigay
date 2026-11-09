import { ScreenFlags, UserModeration } from "@/features/admin/components/user-moderation";
import { button, primary, Section } from "@/features/admin/ui";
import { serverClient } from "@/server/supabase/server";
import { formatDate } from "@/shared/lib/format";
import { screenText } from "@/shared/lib/moderation/screen";
import { deleteQuizQuestion, setQuizQuestionApproved } from "./actions";

const LABELS = ["A", "B", "C", "D"];

/** Moderation queue for fan-contributed quiz questions. */
export async function QuizAdmin() {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("quiz_questions")
    .select("id,author_id,question,option_a,option_b,option_c,option_d,correct_index,explanation,author_name,approved,created_at")
    .order("approved")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as {
    id: string;
    author_id: string;
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
  }[];

  return (
    <Section title="Đố vui Bộ Tộc – duyệt câu hỏi">
      <p className="text-xs text-muted">Kiểm tra nội dung câu hỏi, đáp án đúng và lời giải thích trước khi duyệt lên trang Bộ Tộc.</p>
      <ul className="divide-y divide-border text-sm">
        {rows.map((q) => {
          const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
          return (
            <li key={q.id} className="flex flex-wrap items-start gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{q.question}</span>{" "}
                <span className="text-muted">
                  — {q.author_name} · {formatDate(q.created_at)} · {q.approved ? "đã duyệt" : "chờ duyệt"}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {opts.map((opt, idx) => (
                    <span key={idx} className={idx === q.correct_index ? "mr-3 font-bold text-cleared" : "mr-3"}>
                      {LABELS[idx]}: {opt}
                    </span>
                  ))}
                </span>
                {q.explanation && <span className="block text-xs text-muted">Giải thích: {q.explanation}</span>}
                <ScreenFlags flags={screenText([q.question, ...opts, q.explanation, q.author_name]).flags} />
                <UserModeration userId={q.author_id} />
              </span>
              <form action={setQuizQuestionApproved.bind(null, q.id, !q.approved)}>
                <button className={q.approved ? button : primary}>{q.approved ? "Gỡ duyệt" : "Duyệt"}</button>
              </form>
              <form action={deleteQuizQuestion.bind(null, q.id)}>
                <button className={button} title="Xóa hẳn">
                  Xóa hẳn
                </button>
              </form>
            </li>
          );
        })}
        {!rows.length && <li className="py-2 text-muted">Chưa có câu hỏi nào.</li>}
      </ul>
    </Section>
  );
}

