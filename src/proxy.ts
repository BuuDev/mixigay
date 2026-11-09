import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Refreshes the Supabase session cookie on navigation so Server Components see
// a valid user. Authorization is not decided here: admin pages and actions call
// requireAdmin() and RLS checks again in the database.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Skip static assets, images and machine endpoints (cron jobs, webhooks, Steam proxy).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|manifest|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
