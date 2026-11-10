import { cleanupE2eAccounts, createAdminClient, hasSupabase } from "./supabase";

/** Deletes every "e2e…" account and invite the run created. */
export default async function globalTeardown() {
  if (!hasSupabase) return;
  const removed = await cleanupE2eAccounts(createAdminClient());
  console.log(`e2e cleanup: removed ${removed} account(s)`);
}
