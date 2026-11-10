import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/shared/lib/env";

/** Client acting as the signed-in user (RLS applies). Dynamic: reads cookies. */
export async function serverClient() {
  // Per-user work never runs during a (runtime) prefetch/prerender: supabase-js reads the
  // clock while loading the session, which Cache Components rejects outside request time.
  await connection();
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only; proxy.ts refreshes the session.
        }
      },
    },
  });
}
