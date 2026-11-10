import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { youtubeUrl } from "@/shared/lib/links";

export function liveMessage(title: string, videoId: string): string {
  return `🔴 Anh Độ đang live: ${title}\n${youtubeUrl(videoId)}`;
}

type Sender = { channel: string; send: (text: string) => Promise<void> };

function configuredSenders(): Sender[] {
  const senders: Sender[] = [];
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHANNEL_ID;
  if (tgToken && tgChat) {
    senders.push({
      channel: "telegram",
      send: async (text) => {
        const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: tgChat, text }),
        });
        if (!res.ok) throw new Error(`telegram ${res.status}`);
      },
    });
  }
  const discord = process.env.DISCORD_WEBHOOK_URL;
  if (discord) {
    senders.push({
      channel: "discord",
      send: async (text) => {
        const res = await fetch(discord, {
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

/**
 * Announces a stream once per channel. The notifications_log row is claimed
 * before sending, so overlapping cron runs cannot double-post; a failed send
 * releases the claim so the next run retries.
 */
export async function notifyLive(db: SupabaseClient, live: { videoId: string; title: string }): Promise<string[]> {
  const sent: string[] = [];
  for (const sender of configuredSenders()) {
    const { data, error } = await db
      .from("notifications_log")
      .upsert({ video_id: live.videoId, channel: sender.channel }, { onConflict: "video_id,channel", ignoreDuplicates: true })
      .select();
    if (error || !data?.length) continue;
    try {
      await sender.send(liveMessage(live.title, live.videoId));
      sent.push(sender.channel);
    } catch (e) {
      console.error(`notify ${sender.channel} failed`, e);
      await db.from("notifications_log").delete().match({ video_id: live.videoId, channel: sender.channel });
    }
  }
  return sent;
}
