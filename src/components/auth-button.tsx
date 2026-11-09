import Link from "next/link";
import { signInWithGoogle, signOut } from "@/app/auth/actions";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

/** Server component; dynamic (reads cookies), so render it inside <Suspense>. */
export async function AuthButton() {
  if (!isSupabaseConfigured) return null;
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <form action={signInWithGoogle}>
        <button className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm hover:border-accent">Đăng nhập Google</button>
      </form>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-2 text-sm">
      {viewer.isAdmin && (
        <Link href="/admin" className="rounded-full px-3 py-1.5 text-muted hover:text-foreground">
          Quản trị
        </Link>
      )}
      <span className="max-w-32 truncate text-muted" title={viewer.email}>
        {viewer.name}
      </span>
      <form action={signOut}>
        <button className="rounded-full border border-border px-3 py-1.5 hover:border-accent">Đăng xuất</button>
      </form>
    </div>
  );
}
