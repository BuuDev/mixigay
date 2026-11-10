import { getLiveFeed } from "@/features/live/server/queries";

// The live state for open tabs (useLiveStatus). The handler only reads cached data, so it
// is prerendered and served from the CDN; poll-live expires its `live-timer` tag after every check.
// Tens of thousands of tabs reading it at the same planned moment cost CDN reads, not
// database queries or YouTube calls (ADR-019).
export async function GET() {
  return Response.json(await getLiveFeed());
}
