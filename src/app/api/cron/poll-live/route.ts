import { cronRoute } from "@/lib/jobs/handler";
import { pollLive } from "@/lib/jobs/poll-live";

// Called every minute by Supabase pg_cron (supabase/cron.sql). ?force=1 skips the sparse-polling check.
export const POST = cronRoute((ctx, now, params) => pollLive(ctx, now, { force: params.has("force") }));
