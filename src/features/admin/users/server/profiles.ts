import "server-only";
import { requireAdmin } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";
import { TRUST_VALUE, USER_PAGE, type TrustFilter } from "../lib/user-query";

// Profiles as admins see them, through public.admin_profiles (migration 20261110210000):
// profiles.trust has no column grant (a shadow ban must stay invisible to its target), so
// the admin's own session calls this admin-only function instead of the service-role key.
// Sign-in handles are deliberately not exposed: a handle is half of someone's credentials.

export interface AdminProfile {
  id: string;
  displayName: string;
  createdAt: string;
  trust: number;
  verified: boolean;
}

interface ProfileRow {
  id: string;
  display_name: string;
  created_at: string;
  trust: number | null;
  verified: boolean | null;
}

const map = (r: ProfileRow): AdminProfile => ({
  id: r.id,
  displayName: r.display_name,
  createdAt: r.created_at,
  trust: r.trust ?? 0,
  verified: r.verified === true,
});

async function call(args: { p_ids?: string[]; p_q?: string; p_trust?: number; p_limit?: number }): Promise<AdminProfile[]> {
  await requireAdmin();
  const db = await serverClient();
  const { data, error } = await db.rpc("admin_profiles", args);
  if (error) throw new Error(`admin_profiles: ${error.message}`);
  return ((data ?? []) as ProfileRow[]).map(map);
}

/** Newest accounts first, optionally filtered by name (contains; % and _ are literal) and ban state. */
export function listProfiles({ q, trust }: { q: string; trust: TrustFilter | null }): Promise<AdminProfile[]> {
  return call({ p_q: q || undefined, p_trust: trust ? TRUST_VALUE[trust] : undefined, p_limit: USER_PAGE });
}

export async function getProfile(id: string): Promise<AdminProfile | null> {
  return (await call({ p_ids: [id], p_limit: 1 }))[0] ?? null;
}

/** Trust (and the rest) for a set of users, e.g. the authors on one inbox page. */
export function getProfilesByIds(ids: string[]): Promise<AdminProfile[]> {
  return ids.length ? call({ p_ids: ids, p_limit: Math.min(ids.length, 200) }) : Promise.resolve([]);
}
