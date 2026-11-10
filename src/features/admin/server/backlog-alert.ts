import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/shared/lib/links";
import { backlogAlerts, type HourlyCounts } from "../lib/backlog-alert";

// Queues fans fill; each row starts unapproved until an admin reviews it.
const QUEUES: { table: string; label: string }[] = [
  { table: "suggestions", label: "Đề xuất game" },
  { table: "fan_songs", label: "Nhạc nịnh" },
  { table: "fan_art", label: "Tranh fan" },
  { table: "quiz_links", label: "Link quiz" },
  { table: "quotes", label: "Quote" },
  { table: "glossary_entries", label: "Từ điển" },
  { table: "wall_messages", label: "Lời nhắn" },
];

async function hourlyCounts(db: SupabaseClient, since: string): Promise<HourlyCounts> {
  const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>, what: string) => {
    const { count: n, error } = await q;
    if (error) throw new Error(`count ${what}: ${error.message}`);
    return n ?? 0;
  };
  const pendingPairs = await Promise.all(
    QUEUES.map(
      async (q) =>
        [q.label, await count(db.from(q.table).select("id", { count: "exact", head: true }).eq("approved", false).gte("created_at", since), q.table)] as const,
    ),
  );
  const reports = await count(db.from("reports").select("id", { count: "exact", head: true }).eq("resolved", false).gte("created_at", since), "reports");
  return { pending: Object.fromEntries(pendingPairs), reports };
}

type Sender = { channel: string; send: (text: string) => Promise<void> };

/**
 * Admin-only destinations, separate from the public live-announcement channel:
 * ADMIN_ALERT_TELEGRAM_CHAT_ID (reuses TELEGRAM_BOT_TOKEN) and ADMIN_ALERT_DISCORD_WEBHOOK_URL.
 */
function adminSenders(): Sender[] {
  const senders: Sender[] = [];
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.ADMIN_ALERT_TELEGRAM_CHAT_ID;
  if (token && chat) {
    senders.push({
      channel: "telegram",
      send: async (text) => {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
        });
        if (!res.ok) throw new Error(`telegram ${res.status}`);
      },
    });
  }
  const hook = process.env.ADMIN_ALERT_DISCORD_WEBHOOK_URL;
  if (hook) {
    senders.push({
      channel: "discord",
      send: async (text) => {
        const res = await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, allowed_mentions: { parse: [] } }),
        });
        if (!res.ok) throw new Error(`discord ${res.status}`);
      },
    });
  }
  return senders;
}

/** Checks the last hour and alerts admins at most once per kind per hour. */
export async function checkModerationBacklog(db: SupabaseClient, now: Date) {
  const since = new Date(now.getTime() - 3600_000).toISOString();
  const counts = await hourlyCounts(db, since);
  const alerts = backlogAlerts(counts, now, `${SITE_URL}/admin`);
  const senders = adminSenders();
  const sent: string[] = [];
  for (const alert of alerts) {
    if (!senders.length) break;
    // Claim the hour first so overlapping runs cannot double-post.
    const { data, error } = await db
      .from("admin_alerts")
      .upsert({ kind: alert.kind, bucket: alert.bucket }, { onConflict: "kind,bucket", ignoreDuplicates: true })
      .select();
    if (error || !data?.length) continue;
    const results = await Promise.allSettled(senders.map((s) => s.send(alert.text)));
    if (results.every((r) => r.status === "rejected")) {
      // Nobody got it: release the claim so the next run retries.
      await db.from("admin_alerts").delete().match({ kind: alert.kind, bucket: alert.bucket });
      console.error("admin alert failed", results);
      continue;
    }
    sent.push(alert.kind);
  }
  return { counts, alerts: alerts.map((a) => a.kind), sent, configured: senders.map((s) => s.channel) };
}
