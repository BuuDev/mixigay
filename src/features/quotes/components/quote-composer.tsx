import { getViewer } from "@/features/auth/server/viewer";
import { Card } from "@/shared/ui/card";
import { getMyPendingQuotes, getQuoteVideoOptions } from "../server/queries";
import { QuoteForm } from "./quote-form";
import { MyQuotes } from "./quote-list";

export function QuoteSignInCard() {
  return (
    <Card className="p-4 text-sm">
      <h2 className="font-semibold">Gửi một quote</h2>
      <p className="mt-2 text-muted">Bấm “Vào Bộ Tộc” (góc trên bên phải) để gửi quote. Chỉ cần tên Bộ Tộc + mã khóa, không cần email.</p>
    </Card>
  );
}

/** Dynamic part (session): the form and the viewer's own pending quotes. Render under <Suspense>. */
export async function QuoteComposer() {
  const viewer = await getViewer();
  if (!viewer) return <QuoteSignInCard />;
  const [videos, pending] = await Promise.all([getQuoteVideoOptions(), getMyPendingQuotes(viewer.id)]);
  return (
    <div className="space-y-4">
      <QuoteForm videos={videos} />
      <MyQuotes
        title="Quote của bạn đang chờ duyệt"
        note="Chỉ bạn thấy mục này. Quote hiện công khai sau khi admin duyệt."
        quotes={pending}
        badge="đang chờ duyệt"
      />
    </div>
  );
}
