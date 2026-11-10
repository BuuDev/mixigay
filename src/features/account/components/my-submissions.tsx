import { EmptyState } from "@/shared/ui/empty-state";
import { getMySubmissions } from "../server/queries";
import { SubmissionList } from "./submission-list";

/** "Nội dung của bạn" on /tai-khoan. Dynamic (session): render under <Suspense>. */
export async function MySubmissions({ userId }: { userId: string }) {
  const items = await getMySubmissions(userId);
  return (
    <section aria-labelledby="my-submissions" className="space-y-2">
      <h2 id="my-submissions" className="font-semibold">
        Nội dung của bạn
      </h2>
      {items.length === 0 ? (
        <EmptyState title="Bạn chưa gửi gì">Đề xuất game, nhạc nịnh, fan art hay lời nhắn bạn gửi sẽ hiện ở đây cùng trạng thái duyệt.</EmptyState>
      ) : (
        <>
          <p className="text-xs text-muted">Bài mới gửi cần được duyệt trước khi hiện công khai.</p>
          <SubmissionList items={items} />
        </>
      )}
    </section>
  );
}
