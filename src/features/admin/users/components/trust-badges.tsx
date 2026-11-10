import { Badge } from "@/shared/ui/badge";
import { trustLabel } from "../lib/user-query";

export function TrustBadges({ trust, verified }: { trust: number; verified: boolean }) {
  const t = trustLabel(trust);
  return (
    <>
      {t && <Badge tone={t.tone}>{t.label}</Badge>}
      {verified && <Badge tone="cleared">✓ Chính chủ</Badge>}
    </>
  );
}
