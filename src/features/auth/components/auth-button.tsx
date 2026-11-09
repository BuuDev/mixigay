import Link from "next/link";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { Button, buttonClass } from "@/shared/ui/button";
import { signInWithGoogle, signOut } from "../actions";
import { getViewer } from "../server/viewer";

/** Server component; dynamic (reads cookies), so render it inside <Suspense>. */
export async function AuthButton() {
  if (!isSupabaseConfigured) return null;
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <form action={signInWithGoogle}>
        <Button variant="secondary" size="sm">
          Đăng nhập Google
        </Button>
      </form>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      {viewer.isAdmin && (
        <Link href="/admin" className={buttonClass("ghost", "sm")}>
          Quản trị
        </Link>
      )}
      <span className="hidden max-w-32 truncate text-muted sm:inline" title={viewer.email}>
        {viewer.name}
      </span>
      <form action={signOut}>
        <Button variant="secondary" size="sm">
          Đăng xuất
        </Button>
      </form>
    </div>
  );
}
