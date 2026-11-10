import { cleanupE2eAccounts, createAdminClient, hasSupabase } from "./supabase";

/** Leftovers from an aborted run would trip the sign-up rate limit: start clean. */
export default async function globalSetup() {
  if (hasSupabase) await cleanupE2eAccounts(createAdminClient());
}
