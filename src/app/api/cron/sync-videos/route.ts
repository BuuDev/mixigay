import { cronRoute } from "@/lib/jobs/handler";
import { syncVideos } from "@/lib/jobs/sync-videos";

// Called every 6 hours by Supabase pg_cron (supabase/cron.sql). ?full=1 backfills the whole channel once.
export const POST = cronRoute((ctx, now, params) => syncVideos(ctx, now, { full: params.has("full") }));

// A full backfill pages through thousands of videos.
export const maxDuration = 300;
