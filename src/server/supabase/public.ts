import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/shared/lib/env";

let client: SupabaseClient | undefined;

/**
 * Anonymous, cookie-less client for public reads inside "use cache" scopes,
 * which may not touch cookies(). Subject to RLS as the anon role.
 */
export function publicClient(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
