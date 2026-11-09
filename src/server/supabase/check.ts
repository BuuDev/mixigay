// The client is untyped (no generated Database type yet), so rows are asserted to
// the Row interfaces each feature declares in its lib/mapper.ts. PostgREST returns
// many-to-one embeds as objects.
export function check<T>(result: { data: unknown; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Supabase ${what}: ${result.error.message}`);
  return result.data as T;
}
