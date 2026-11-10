import { requireAdmin } from "@/features/auth/server/viewer";
import { FanArtAdmin } from "@/features/fan-art/admin/fan-art-admin";

export default async function Page() {
  await requireAdmin();
  return <FanArtAdmin />;
}

