import { requireAdmin } from "@/features/auth/server/viewer";
import { QuizAdmin } from "@/features/quiz/admin/quiz-admin";

export default async function Page() {
  await requireAdmin();
  return <QuizAdmin />;
}

