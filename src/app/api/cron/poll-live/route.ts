import { cronRoute } from "@/server/jobs/handler";
import { pollLive } from "@/features/live/server/poll-live";

// Called every minute by Supabase pg_cron (supabase/cron.sql). ?force=1 skips the sparse-polling check.
export const POST = cronRoute((ctx, now, params) => pollLive(ctx, now, { force: params.has("force") }));
