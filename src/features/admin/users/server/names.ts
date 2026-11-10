import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Display names for a set of user ids (profiles.display_name is world-readable). */
export async function profileNames(supabase: SupabaseClient, ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map();
  const { data, error } = await supabase.from("profiles").select("id,display_name").in("id", unique);
  if (error) throw new Error(`profileNames: ${error.message}`);
  return new Map(((data ?? []) as { id: string; display_name: string }[]).map((p) => [p.id, p.display_name]));
}
