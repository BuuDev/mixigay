import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/server/viewer";
import { serverClient } from "@/server/supabase/server";

// Shared plumbing for admin Server Actions. Every action calls adminDb() first:
// it re-checks admin rights, and RLS (is_admin()) enforces the same rule in Postgres.

export async function adminDb() {
  await requireAdmin();
  return serverClient();
}

export function fail(what: string, error: { message: string } | null) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

export const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export const optional = (fd: FormData, key: string) => str(fd, key) || null;
export const slug = z.string().regex(/^[a-z0-9-]+$/, "slug chỉ gồm a-z, 0-9, dấu gạch");
