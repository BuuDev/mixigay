import "server-only";
import { isAuthorizedCron } from "../cron-auth";
import { JobConfigError, jobContext, QuotaExceededError, type JobContext } from "./context";

/** Wraps a job as a POST route: cron auth, config errors → 503, quota guard → 429. */
export function cronRoute(run: (ctx: JobContext, now: Date, params: URLSearchParams) => Promise<unknown>) {
  return async function POST(request: Request): Promise<Response> {
    if (!isAuthorizedCron(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
    try {
      const result = await run(jobContext(), new Date(), new URL(request.url).searchParams);
      return Response.json(result);
    } catch (e) {
      if (e instanceof JobConfigError) return Response.json({ error: e.message }, { status: 503 });
      if (e instanceof QuotaExceededError) return Response.json({ error: e.message }, { status: 429 });
      console.error(e);
      return Response.json({ error: "job failed" }, { status: 500 });
    }
  };
}
