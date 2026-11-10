import { Suspense } from "react";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { getWallMessages } from "../server/queries";
import { WallComposer, WallSignInCard } from "./wall-composer";
import { WallDemo } from "./wall-demo";
import { WallList } from "./wall-list";

/** "Bức tường Bộ Tộc": cached public wall + the per-viewer form under <Suspense>. */
export async function WallSection() {
  const messages = await getWallMessages();
  if (!isSupabaseConfigured) return <WallDemo initial={messages} />;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <WallList messages={messages} />
      <div className="self-start lg:sticky lg:top-20">
        <Suspense fallback={<WallSignInCard />}>
          <WallComposer />
        </Suspense>
      </div>
    </div>
  );
}
