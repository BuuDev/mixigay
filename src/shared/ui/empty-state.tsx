import type { ReactNode } from "react";
import { Illustration, Mascot, SceneArt, type IllustrationName, type MascotPose, type Scene } from "./brand-art";

/**
 * Dashed box for "nothing here yet". Art, first match wins: `mascot` (Cú Đêm pose),
 * `scene` (fan-made anh Độ + Cú Đêm drawing), then the older SVG `art` illustration.
 * The title already says what is missing, so mascot art is decorative.
 */
export function EmptyState({
  art,
  mascot,
  scene,
  title,
  children,
}: {
  art?: IllustrationName;
  mascot?: MascotPose;
  scene?: Scene;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      {mascot ? (
        <Mascot pose={mascot} size={128} decorative />
      ) : scene ? (
        <SceneArt scene={scene} size={144} />
      ) : art ? (
        <Illustration name={art} width={200} />
      ) : null}
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}
