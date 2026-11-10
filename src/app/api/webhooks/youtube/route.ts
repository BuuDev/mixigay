import { parseFeed, topicUrl, verifyChallenge, verifySignature, WEBSUB_MAX_BODY_BYTES } from "@/features/videos/lib/websub";
import { BodyTooLargeError, ingestVideos, markDeleted, readBodyLimited, websubConfig } from "@/features/videos/server/websub";
import { JobConfigError, jobContext, QuotaExceededError } from "@/server/jobs/context";

// YouTube WebSub callback (docs/02-architecture.md flow 3). The hub verifies the
// subscription with GET and pushes Atom notifications with POST.

const notConfigured = () => Response.json({ error: "websub not configured" }, { status: 503 });

export async function GET(request: Request): Promise<Response> {
  const config = websubConfig();
  if (!config) return notConfigured();
  const challenge = verifyChallenge(new URL(request.url).searchParams, topicUrl(config.channelId));
  if (!challenge) return new Response("not found", { status: 404 });
  return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(request: Request): Promise<Response> {
  const config = websubConfig();
  if (!config) return notConfigured();

  let raw: Buffer;
  try {
    raw = await readBodyLimited(request, WEBSUB_MAX_BODY_BYTES);
  } catch (e) {
    if (e instanceof BodyTooLargeError) return new Response(null, { status: 413 });
    throw e;
  }

  // Unsigned or wrongly signed bodies are acknowledged but ignored (2xx so the hub does not retry).
  if (!verifySignature(raw, request.headers.get("x-hub-signature"), config.secret)) {
    console.warn("websub: ignored notification with missing/invalid signature");
    return new Response(null, { status: 202 });
  }

  const { videoIds, deleted } = parseFeed(raw.toString("utf8"), config.channelId);
  if (!videoIds.length && !deleted.length) return new Response(null, { status: 204 });

  try {
    const ctx = jobContext();
    if (deleted.length) await markDeleted(ctx.db, deleted);
    if (videoIds.length) await ingestVideos(ctx, videoIds);
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof JobConfigError) return Response.json({ error: e.message }, { status: 503 });
    // Over the daily guard: acknowledge so the hub does not retry; sync-videos catches up later.
    if (e instanceof QuotaExceededError) {
      console.warn(`websub: ${e.message}; skipped ${videoIds.length} id(s)`);
      return new Response(null, { status: 202 });
    }
    console.error(e);
    return Response.json({ error: "ingest failed" }, { status: 500 });
  }
}
