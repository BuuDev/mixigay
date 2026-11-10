import { renewSubscription } from "@/features/videos/server/websub";
import { isAuthorizedCron } from "@/server/jobs/cron-auth";

// Called daily by Supabase pg_cron (supabase/cron.sql) to restart the 10-day WebSub lease.
// Needs no YouTube API call, so it does not go through cronRoute/jobContext.
export async function POST(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await renewSubscription(new Date());
    if ("skipped" in result && result.skipped === "not-configured") {
      return Response.json({ error: "WEBSUB_SECRET / YOUTUBE_CHANNEL_ID not set" }, { status: 503 });
    }
    if ("ok" in result && !result.ok) return Response.json(result, { status: 502 });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "renew failed" }, { status: 500 });
  }
}
