import { checkModerationBacklog } from "@/features/admin/server/backlog-alert";
import { isAuthorizedCron } from "@/server/jobs/cron-auth";
import { adminClient } from "@/server/supabase/admin";

// Called every 5 minutes by Supabase pg_cron (supabase/cron.sql). Needs no YouTube key,
// so it does not go through cronRoute/jobContext.
export async function POST(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  let db;
  try {
    db = adminClient();
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 503 });
  }
  try {
    return Response.json(await checkModerationBacklog(db, new Date()));
  } catch (e) {
    console.error(e);
    return Response.json({ error: "job failed" }, { status: 500 });
  }
}
