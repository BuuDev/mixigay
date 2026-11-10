import { EmptyState } from "@/shared/ui/empty-state";
import { QUIZ_PLATFORM_LIST } from "../lib/quiz-url";
import { groupQuizLinks } from "../lib/mapper";
import type { QuizLink } from "../types";
import { QuizLinkCard } from "./quiz-link-card";

function QuizGrid({ links }: { links: QuizLink[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {links.map((l) => (
        <li key={l.id}>
          <QuizLinkCard link={l} headingLevel={4} />
        </li>
      ))}
    </ul>
  );
}

/** Approved quiz links: the ones anh Độ already played first, then the rest, each newest first. */
export function QuizBoard({ links }: { links: QuizLink[] }) {
  if (!links.length) {
    return (
      <EmptyState mascot="gaming" title="Chưa có quiz nào trên bảng">
        Bạn đã làm một bộ câu hỏi về anh Độ và Bộ Tộc trên {QUIZ_PLATFORM_LIST}? Gửi link vào đây để cả Bộ Tộc cùng chơi, biết đâu anh Độ mở ra chơi trên sóng.
      </EmptyState>
    );
  }
  const { played, fresh } = groupQuizLinks(links);
  return (
    <div className="space-y-6">
      {played.length > 0 && (
        <section aria-labelledby="quiz-played-heading" className="space-y-3">
          <h3 id="quiz-played-heading" className="font-semibold">
            Anh Độ đã chơi
          </h3>
          <QuizGrid links={played} />
        </section>
      )}
      {fresh.length > 0 && (
        <section aria-labelledby="quiz-fresh-heading" className="space-y-3">
          <h3 id="quiz-fresh-heading" className={played.length > 0 ? "font-semibold" : "sr-only"}>
            Đang chờ anh Độ chơi
          </h3>
          <QuizGrid links={fresh} />
        </section>
      )}
    </div>
  );
}
