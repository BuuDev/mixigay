import { getViewer } from "@/features/auth/server/viewer";
import { Card } from "@/shared/ui/card";
import { getMyPendingWallMessages } from "../server/queries";
import { WallForm } from "./wall-form";
import { WallMessageCard } from "./wall-message-card";

export function WallSignInCard() {
  return (
    <Card className="p-4 text-sm">
      <h3 className="font-semibold">Viết lên tường</h3>
      <p className="mt-2 text-muted">Bấm “Vào Bộ Tộc” (góc trên bên phải) để viết lời nhắn. Chỉ cần tên Bộ Tộc + mã khóa, không cần email.</p>
    </Card>
  );
}

/** Dynamic part (session): the form and the viewer's own pending messages. Render under <Suspense>. */
export async function WallComposer() {
  const viewer = await getViewer();
  if (!viewer) return <WallSignInCard />;
  const pending = await getMyPendingWallMessages(viewer.id);
  return (
    <div className="space-y-4">
      <WallForm />
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Lời nhắn của bạn đang chờ duyệt</h3>
          <p className="text-xs text-muted">Chỉ bạn thấy mục này. Lời nhắn hiện công khai sau khi admin duyệt.</p>
          <ul className="space-y-2">
            {pending.map((w) => (
              <li key={w.id}>
                <WallMessageCard message={w} pending />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
