import { Card } from "@/shared/ui/card";
import { getMyPendingQuizLinks } from "../server/queries";
import { QuizLinkCard } from "./quiz-link-card";
import { QuizLinkForm } from "./quiz-form";

/** Shown to anonymous viewers, in demo mode and as the <Suspense> fallback. */
export function QuizSignInCard({ demo = false }: { demo?: boolean }) {
  return (
    <Card className="p-4 text-sm">
      <h3 className="font-semibold">Gửi link quiz của bạn</h3>
      <p className="mt-2 text-muted">
        {demo
          ? "Chế độ demo: chưa nối Supabase nên chưa gửi được link quiz."
          : "Bấm “Vào Bộ Tộc” (góc trên bên phải) để gửi link quiz bạn làm. Chỉ cần tên Bộ Tộc + mã khóa, không cần email."}
      </p>
    </Card>
  );
}

/** Dynamic part (session): the form and the viewer's own pending links. Render under <Suspense>. */
export async function QuizComposer({ viewerId }: { viewerId: string }) {
  const pending = await getMyPendingQuizLinks(viewerId);
  return (
    <div className="space-y-4">
      <QuizLinkForm />
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Link của bạn đang chờ duyệt</h3>
          <p className="text-xs text-muted">Chỉ bạn thấy mục này. Link hiện công khai sau khi admin duyệt.</p>
          <ul className="space-y-2">
            {pending.map((l) => (
              <li key={l.id}>
                <QuizLinkCard link={l} badge="Đang chờ duyệt" headingLevel={4} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
