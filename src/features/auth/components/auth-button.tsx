import Link from "next/link";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { Button, buttonClass } from "@/shared/ui/button";
import { signOut } from "../actions";
import { getViewer } from "../server/viewer";
import { AuthDialog } from "./auth-dialog";

/** Server component; dynamic (reads cookies), so render it inside <Suspense>. */
export async function AuthButton() {
  if (!isSupabaseConfigured) return null;
  const viewer = await getViewer();
  if (!viewer) return <AuthDialog />;
  return (
    <div className="flex items-center gap-2 text-sm">
      {viewer.isAdmin && (
        <Link href="/admin" className={buttonClass("ghost", "sm")}>
          Quản trị
        </Link>
      )}
      <Link href="/tai-khoan" className="hidden max-w-36 truncate text-muted hover:text-foreground sm:inline">
        {viewer.name}
        {viewer.verified && <span className="ml-1 text-cleared">✓</span>}
      </Link>
      <form action={signOut}>
        <Button variant="secondary" size="sm">
          Thoát
        </Button>
      </form>
    </div>
  );
}
