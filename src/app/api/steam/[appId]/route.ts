import { getViewer } from "@/features/auth/server/viewer";
import { getSteamDetails } from "@/features/suggestions/server/steam";
import { serverClient } from "@/server/supabase/server";

// Preview for the suggestion form. Signed-in only, so the route cannot be used to
// hammer Steam from our IP (Steam rate-limits appdetails to ~200 per 5 minutes).
export async function GET(_request: Request, ctx: RouteContext<"/api/steam/[appId]">) {
  const { appId } = await ctx.params;
  if (!/^\d{1,8}$/.test(appId)) return Response.json({ error: "invalid appId" }, { status: 400 });
  if (!(await getViewer())) return Response.json({ error: "sign in required" }, { status: 401 });
  // Per-fan budget (20 per 10 minutes, take_steam_lookup in Postgres) so one account
  // cannot burn the shared Steam allowance by cycling app ids past the cache.
  const { data: allowed, error } = await (await serverClient()).rpc("take_steam_lookup");
  if (error || allowed !== true) return Response.json({ error: "rate limited" }, { status: 429, headers: { "Retry-After": "600" } });
  const details = await getSteamDetails(Number(appId));
  if (!details) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(details);
}
