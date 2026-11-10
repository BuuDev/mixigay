// Service-role helpers for the E2E suite. Only usable against the DEV Supabase project:
// they create throwaway "e2e…" accounts and delete them again.
import { createHmac } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ipv6Prefix64 } from "../src/features/auth/lib/network";

export const E2E_PREFIX = "e2e";

/** True when the env points at a Supabase project and the service-role key is present. */
export const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Short random suffix so parallel and repeated runs never collide on handles or names. */
export function uniqueTag(): string {
  return `${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2, 5)}`;
}

/** auth.users id behind a handle (account_logins.handle_key is the normalised handle). */
export async function userIdForHandle(admin: SupabaseClient, handle: string): Promise<string> {
  const { data, error } = await admin.from("account_logins").select("user_id").eq("handle_key", handle).single();
  if (error || !data) throw new Error(`no account for ${handle}: ${error?.message}`);
  return data.user_id as string;
}

/**
 * Rate-limit keys the app derives for a browser on this machine (same HMAC as
 * src/features/auth/server/accounts.ts `clientKey`). Which address the server sees
 * depends on the host, so every loopback form is covered.
 */
function localClientKeys(): string[] {
  const salt = process.env.AUTH_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";
  const nets = ["unknown", "127.0.0.1", ipv6Prefix64("::1"), ipv6Prefix64("::ffff:127.0.0.1")];
  return nets.map((ip) => createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32));
}

/**
 * Removes every e2e account (cascades to profiles, account_logins, suggestions, votes…),
 * every e2e invite, and only this machine's sign-up / invite / sign-in attempt counters,
 * so the per-IP sign-up limit (3 per hour) does not block the next run. Dev project only.
 */
export async function cleanupE2eAccounts(admin: SupabaseClient): Promise<number> {
  const { data: logins } = await admin.from("account_logins").select("user_id").like("handle_key", `${E2E_PREFIX}%`);
  for (const l of logins ?? []) await admin.auth.admin.deleteUser(l.user_id as string);
  await admin.from("invites").delete().like("handle_key", `${E2E_PREFIX}%`);
  await admin.from("auth_attempts").delete().in("kind", ["signup_ip", "invite_ip", "login_ip"]).in("key", localClientKeys());
  await admin.from("auth_attempts").delete().eq("kind", "login_handle").like("key", `${E2E_PREFIX}%`);
  return logins?.length ?? 0;
}
