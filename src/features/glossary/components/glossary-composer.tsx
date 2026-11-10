import { getViewer } from "@/features/auth/server/viewer";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { Card } from "@/shared/ui/card";
import { getMyPendingGlossaryEntries } from "../server/queries";
import { GlossaryDemo, PendingList } from "./glossary-demo";
import { GlossaryForm } from "./glossary-form";

export function GlossarySignInCard() {
  return (
    <Card className="p-4 text-sm">
      <h3 className="font-semibold">Góp từ cho từ điển</h3>
      <p className="mt-2 text-muted">
        Bấm “Vào Bộ Tộc” (góc trên bên phải) để góp từ, biệt danh hay meme kèm link nguồn. Chỉ cần tên Bộ Tộc + mã khóa, không cần email.
      </p>
    </Card>
  );
}

/** Dynamic part (session): the form and the viewer's own pending entries. Render under <Suspense>. */
export async function GlossaryComposer() {
  if (!isSupabaseConfigured) return <GlossaryDemo />;
  const viewer = await getViewer();
  if (!viewer) return <GlossarySignInCard />;
  const pending = await getMyPendingGlossaryEntries(viewer.id);
  return (
    <div className="space-y-4">
      <GlossaryForm />
      {pending.length > 0 && <PendingList entries={pending} />}
    </div>
  );
}
