import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/shared/lib/env";

/**
 * Service-role client: bypasses RLS. For src/app/api/cron/** and src/app/api/webhooks/**
 * (they authenticate the caller themselves) and the few documented exceptions in
 * docs/07-conventions.md ("Service role"), e.g. writing sanitised game art to Storage.
 */
export function adminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL not set");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
