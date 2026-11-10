import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isLocalUrl, parseFeed, subscribeForm, topicUrl, verifyChallenge, verifySignature } from "./websub";

const CH = "UCA_23dkEYToAc37hjSsCnXA";
const OTHER = "UCxxxxxxxxxxxxxxxxxxxxxx";
const SECRET = "s3cret";

const sign = (body: string | Buffer, algo: "sha1" | "sha256" = "sha1", secret = SECRET) => `${algo}=${createHmac(algo, secret).update(body).digest("hex")}`;

const entry = (id: string, channel = CH) => `
 <entry>
  <id>yt:video:${id}</id>
  <yt:videoId>${id}</yt:videoId>
  <yt:channelId>${channel}</yt:channelId>
  <title>Video title</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=${id}"/>
  <author><name>Channel</name><uri>https://www.youtube.com/channel/${channel}</uri></author>
  <published>2026-11-10T12:00:00+00:00</published>
  <updated>2026-11-10T12:00:05.123456789+00:00</updated>
 </entry>`;

const feed = (body: string) => `<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
 <link rel="hub" href="https://pubsubhubbub.appspot.com"/>
 <link rel="self" href="${topicUrl(CH)}"/>
 <title>YouTube video feed</title>
 <updated>2026-11-10T12:00:05+00:00</updated>${body}
</feed>`;

const tombstone = (id: string, channel = CH) => `<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns:at="http://purl.org/atompub/tombstones/1.0" xmlns="http://www.w3.org/2005/Atom">
  <at:deleted-entry ref="yt:video:${id}" when="2026-11-10T12:00:00+00:00">
    <link href="https://www.youtube.com/watch?v=${id}"/>
    <at:by><name>Channel</name><uri>https://www.youtube.com/channel/${channel}</uri></at:by>
  </at:deleted-entry>
</feed>`;

describe("topicUrl", () => {
  it("builds the channel feed topic", () => {
    expect(topicUrl(CH)).toBe(`https://www.youtube.com/xml/feeds/videos.xml?channel_id=${CH}`);
  });
});

describe("verifySignature", () => {
  const body = feed(entry("dQw4w9WgXcQ"));

  it("accepts a valid sha1 signature for string and Buffer bodies", () => {
    expect(verifySignature(body, sign(body), SECRET)).toBe(true);
    expect(verifySignature(Buffer.from(body), sign(body), SECRET)).toBe(true);
  });

  it("accepts sha256 and upper-case hex", () => {
    expect(verifySignature(body, sign(body, "sha256"), SECRET)).toBe(true);
    expect(verifySignature(body, sign(body).toUpperCase().replace("SHA1", "sha1"), SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifySignature(body.replace("dQw4w9WgXcQ", "aaaaaaaaaaa"), sign(body), SECRET)).toBe(false);
  });

  it("rejects the wrong secret", () => {
    expect(verifySignature(body, sign(body, "sha1", "other"), SECRET)).toBe(false);
  });

  it("rejects missing or malformed headers and an empty secret", () => {
    expect(verifySignature(body, null, SECRET)).toBe(false);
    expect(verifySignature(body, "", SECRET)).toBe(false);
    expect(verifySignature(body, "sha1=", SECRET)).toBe(false);
    expect(verifySignature(body, "sha1=zz", SECRET)).toBe(false);
    expect(verifySignature(body, "md5=" + "a".repeat(32), SECRET)).toBe(false);
    expect(verifySignature(body, sign(body).slice(0, -2), SECRET)).toBe(false);
    expect(verifySignature(body, sign(body, "sha256").replace("sha256", "sha1"), SECRET)).toBe(false);
    expect(verifySignature(body, sign(body, "sha1", ""), "")).toBe(false);
  });
});

describe("parseFeed", () => {
  it("reads a new-video notification", () => {
    expect(parseFeed(feed(entry("dQw4w9WgXcQ")), CH)).toEqual({ videoIds: ["dQw4w9WgXcQ"], deleted: [] });
  });

  it("deduplicates and keeps order", () => {
    expect(parseFeed(feed(entry("bbbbbbbbbbb") + entry("aaaaaaaaaaa") + entry("bbbbbbbbbbb")), CH).videoIds).toEqual(["bbbbbbbbbbb", "aaaaaaaaaaa"]);
  });

  it("reads a deleted entry", () => {
    expect(parseFeed(tombstone("dQw4w9WgXcQ"), CH)).toEqual({ videoIds: [], deleted: ["dQw4w9WgXcQ"] });
  });

  it("accepts a self-closing deleted entry without an owner", () => {
    expect(parseFeed(`<feed><at:deleted-entry ref="yt:video:dQw4w9WgXcQ" when="x"/></feed>`, CH).deleted).toEqual(["dQw4w9WgXcQ"]);
  });

  it("ignores entries of another channel", () => {
    expect(parseFeed(feed(entry("dQw4w9WgXcQ", OTHER)), CH).videoIds).toEqual([]);
    expect(parseFeed(tombstone("dQw4w9WgXcQ", OTHER), CH).deleted).toEqual([]);
  });

  it("ignores entries without a channel id", () => {
    expect(parseFeed(`<feed><entry><yt:videoId>dQw4w9WgXcQ</yt:videoId></entry></feed>`, CH).videoIds).toEqual([]);
  });

  it("rejects invalid ids", () => {
    expect(parseFeed(feed(entry("short") + entry("has spaces!") + entry("<script>x</script>")), CH).videoIds).toEqual([]);
    expect(parseFeed(tombstone("../../etc"), CH).deleted).toEqual([]);
  });

  it("caps at 50 ids", () => {
    const ids = Array.from({ length: 60 }, (_, i) => `v${String(i).padStart(10, "0")}`);
    expect(parseFeed(feed(ids.map((id) => entry(id)).join("")), CH).videoIds).toHaveLength(50);
  });

  it("returns nothing for garbage", () => {
    expect(parseFeed("not xml at all", CH)).toEqual({ videoIds: [], deleted: [] });
    expect(parseFeed("", CH)).toEqual({ videoIds: [], deleted: [] });
    expect(parseFeed("<entry><yt:videoId>dQw4w9WgXcQ", CH)).toEqual({ videoIds: [], deleted: [] });
  });
});

describe("verifyChallenge", () => {
  const topic = topicUrl(CH);
  const q = (o: Record<string, string>) => new URLSearchParams(o);

  it("echoes the challenge for subscribe and unsubscribe", () => {
    expect(verifyChallenge(q({ "hub.mode": "subscribe", "hub.topic": topic, "hub.challenge": "abc123" }), topic)).toBe("abc123");
    expect(verifyChallenge(q({ "hub.mode": "unsubscribe", "hub.topic": topic, "hub.challenge": "xyz" }), topic)).toBe("xyz");
  });

  it("refuses a foreign topic, unknown mode, or bad challenge", () => {
    expect(verifyChallenge(q({ "hub.mode": "subscribe", "hub.topic": topicUrl(OTHER), "hub.challenge": "a" }), topic)).toBeNull();
    expect(verifyChallenge(q({ "hub.mode": "denied", "hub.topic": topic, "hub.challenge": "a" }), topic)).toBeNull();
    expect(verifyChallenge(q({ "hub.mode": "subscribe", "hub.topic": topic }), topic)).toBeNull();
    expect(verifyChallenge(q({ "hub.mode": "subscribe", "hub.topic": topic, "hub.challenge": "" }), topic)).toBeNull();
    expect(verifyChallenge(q({ "hub.mode": "subscribe", "hub.topic": topic, "hub.challenge": "x".repeat(201) }), topic)).toBeNull();
    expect(verifyChallenge(q({}), topic)).toBeNull();
  });
});

describe("isLocalUrl", () => {
  it("flags local hosts and garbage", () => {
    for (const u of ["http://localhost:3000", "http://127.0.0.1", "http://app.localhost", "http://[::1]:3000", "not a url"]) expect(isLocalUrl(u)).toBe(true);
    expect(isLocalUrl("https://gocbotoc.example")).toBe(false);
  });
});

describe("subscribeForm", () => {
  it("builds the hub form", () => {
    const f = subscribeForm({ channelId: CH, callback: "https://x.example/api/webhooks/youtube", secret: SECRET });
    expect(Object.fromEntries(f)).toEqual({
      "hub.mode": "subscribe",
      "hub.topic": topicUrl(CH),
      "hub.callback": "https://x.example/api/webhooks/youtube",
      "hub.secret": SECRET,
      "hub.lease_seconds": "864000",
      "hub.verify": "async",
    });
  });
});
