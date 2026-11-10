import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/shared/lib/env";

let client: SupabaseClient | undefined;

/**
 * Anonymous, cookie-less client for public reads inside "use cache" scopes,
 * which may not touch cookies(). Subject to RLS as the anon role.
 */
export function publicClient(): SupabaseClient {
  // `accessToken` returning null disables the Auth client entirely (requests fall back to the
  // anon key). Otherwise supabase-js starts a background session load that calls Date.now()
  // after the "use cache" scope has returned, which Cache Components rejects at prerender.
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { accessToken: async () => null });
  return client;
}
