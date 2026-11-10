import { Suspense } from "react";
import { getThemeSchedule } from "../server/queries";
import { ThemeApplier } from "./theme-applier";

async function ScheduledSkin() {
  return <ThemeApplier windows={await getThemeSchedule()} />;
}

/** Root-layout slot for the seasonal skin. Never blocks the shell: it renders nothing visible. */
export function SeasonalSkin() {
  return (
    <Suspense fallback={null}>
      <ScheduledSkin />
    </Suspense>
  );
}
