import type { Metadata } from "next";
import { Suspense } from "react";
import { getViewer } from "@/features/auth/server/viewer";
import { QuizBoard } from "@/features/quiz/components/quiz-board";
import { QuizComposer, QuizSignInCard } from "@/features/quiz/components/quiz-composer";
import { getQuizLinks } from "@/features/quiz/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { Mascot } from "@/shared/ui/brand-art";
import { IconCleared } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Quiz Bộ Tộc – Góc Bộ Tộc" };

export default async function QuizPage() {
  const links = await getQuizLinks();
  return (
    <div className="space-y-6">
      <PageHeader title="Quiz Bộ Tộc" icon={<IconCleared size={26} className="text-accent" />} art={<Mascot pose="gaming" size={128} />}>
        Bộ câu hỏi anh em tự làm cho anh Độ trên Kahoot, Wayground (Quizizz), Wordwall, Quizlet, Blooket hay Google Forms. Góc Bộ Tộc chỉ giữ link, bấm vào là
        chơi ngay trên trang gốc. Bạn cũng làm được một bộ? Gửi link ở khung “Gửi link quiz của bạn”.
      </PageHeader>
      <section aria-labelledby="quiz-board-heading" className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <h2 id="quiz-board-heading" className="sr-only">
          Bảng quiz Bộ Tộc làm cho anh Độ
        </h2>
        <QuizBoard links={links} />
        <div className="self-start lg:sticky lg:top-20">
          <Suspense fallback={<QuizSignInCard />}>
            <QuizSubmitBox />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

/** Dynamic part (session): the form for signed-in fans, a sign-in card otherwise. */
async function QuizSubmitBox() {
  if (!isSupabaseConfigured) return <QuizSignInCard demo />;
  const viewer = await getViewer();
  if (!viewer) return <QuizSignInCard />;
  return <QuizComposer viewerId={viewer.id} />;
}
