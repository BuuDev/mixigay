import { getViewer } from "@/lib/auth";
import { getSteamDetails } from "@/lib/steam-cache";

// Preview for the suggestion form. Signed-in only, so the route cannot be used to
// hammer Steam from our IP (Steam rate-limits appdetails to ~200 per 5 minutes).
export async function GET(_request: Request, ctx: RouteContext<"/api/steam/[appId]">) {
  const { appId } = await ctx.params;
  if (!/^\d{1,8}$/.test(appId)) return Response.json({ error: "invalid appId" }, { status: 400 });
  if (!(await getViewer())) return Response.json({ error: "sign in required" }, { status: 401 });
  const details = await getSteamDetails(Number(appId));
  if (!details) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(details);
}
