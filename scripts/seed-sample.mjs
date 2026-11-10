// Realistic sample data for a DEV Supabase project, built only from things that are
// real and checkable: the channel's own videos (ids, titles, thumbnails from the mock
// snapshot of 2026-11-09), real Steam games, real fan songs on SoundCloud. Sample fan
// accounts are clearly named "Fan mẫu …" (handles mau01…mau06) so nobody mistakes
// them for real people.
//
// It never invents quotes, tournament results, chapter titles or anything said by or
// about anh Độ — those stay empty until admins/fans enter them from the real stream.
//
//   node scripts/seed-sample.mjs           # add (idempotent)
//   node scripts/seed-sample.mjs --remove  # delete the sample accounts and their rows
//
// Reads NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from the env files via @next/env.
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { games as mockGames, videos as mockVideos } from "../src/features/videos/mock.ts";
import { fanSongs as mockSongs } from "../src/features/music/mock.ts";
import { fetchSteamDetails } from "../src/features/suggestions/lib/steam.ts";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error: console.error });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}
// Never on production by accident: the project must be named explicitly.
const ref = new URL(url).hostname.split(".")[0];
const allowed = (process.env.SEED_SAMPLE_ALLOW ?? "").split(",").map((s) => s.trim());
if (!["localhost", "127"].includes(ref) && !allowed.includes(ref)) {
  console.error(`Refusing to seed project "${ref}". Run with SEED_SAMPLE_ALLOW=${ref} if this is a dev project.`);
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const must = (what, { error, data }) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

const FANS = Array.from({ length: 6 }, (_, i) => ({ handle: `mau0${i + 1}`, name: `Fan mẫu ${i + 1}` }));

// A sample account is one of the six exact handles AND still named "Fan mẫu …"; a real
// fan who registered "mau01" with another name is never touched.
async function sampleLogins() {
  const logins = must(
    "list",
    await db
      .from("account_logins")
      .select("user_id, handle_key")
      .in(
        "handle_key",
        FANS.map((f) => f.handle),
      ),
  );
  if (!logins.length) return [];
  const named = must(
    "names",
    await db
      .from("profiles")
      .select("id, display_name")
      .in(
        "id",
        logins.map((l) => l.user_id),
      ),
  );
  const ok = new Set(named.filter((p) => p.display_name?.startsWith("Fan mẫu")).map((p) => p.id));
  for (const l of logins) if (!ok.has(l.user_id)) console.warn(`Skipping ${l.handle_key}: not a sample account.`);
  return logins.filter((l) => ok.has(l.user_id));
}

if (process.argv.includes("--remove")) {
  const logins = await sampleLogins();
  for (const l of logins) must(`delete ${l.handle_key}`, await db.auth.admin.deleteUser(l.user_id));
  console.log(`Removed ${logins.length} sample accounts (their suggestions, songs, wall messages, votes and taps cascade).`);
  process.exit(0);
}

// ---- Sample fans (no email: synthetic address, random passphrase nobody needs) ----
const ids = {};
const reuse = new Map((await sampleLogins()).map((l) => [l.handle_key, l.user_id]));
for (const f of FANS) {
  if (reuse.has(f.handle)) {
    ids[f.handle] = reuse.get(f.handle);
    continue;
  }
  const taken = must("lookup", await db.from("account_logins").select("user_id").eq("handle_key", f.handle).maybeSingle());
  if (taken) throw new Error(`Handle ${f.handle} belongs to a real account; not seeding.`);
  const email = `u-${randomUUID()}@id.gocbotoc.invalid`;
  const user = must(
    `create ${f.handle}`,
    await db.auth.admin.createUser({ email, password: randomUUID(), email_confirm: true, user_metadata: { full_name: f.name } }),
  ).user;
  must("login row", await db.from("account_logins").insert({ handle_key: f.handle, user_id: user.id, auth_email: email }));
  ids[f.handle] = user.id;
}
// Old enough to vote (accounts < 24 h cannot).
must(
  "age",
  await db
    .from("profiles")
    .update({ created_at: new Date(Date.now() - 7 * 864e5).toISOString() })
    .in("id", Object.values(ids)),
);
console.log(`Sample fans: ${FANS.map((f) => f.name).join(", ")}`);

// ---- Real videos of the channel ----
const knownGames = new Set(must("games", await db.from("games").select("slug")).map((g) => g.slug));
const classify = (title) => mockGames.find((g) => g.keywords.some((k) => title.toLowerCase().includes(k.trim())))?.slug;
const rows = mockVideos.map((v) => {
  const slug = v.manualGameSlug ?? classify(v.title);
  return {
    video_id: v.videoId,
    title: v.title,
    published_at: v.publishedAt,
    duration_seconds: Math.round(v.durationMinutes * 60),
    view_count: v.viewCount,
    thumbnail_url: v.thumbnailUrl ?? `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
    was_live: v.wasLive,
    auto_game_slug: slug && knownGames.has(slug) ? slug : null,
  };
});
must("videos", await db.from("videos").upsert(rows, { onConflict: "video_id", ignoreDuplicates: true }));
console.log(`Videos: ${rows.length} real uploads/restreams (existing rows untouched).`);

// ---- Suggestions: real Steam games, neutral reasons ----
const SUGGESTIONS = [
  {
    by: "mau01",
    name: "Liar's Bar",
    source: "steam",
    url: "https://store.steampowered.com/app/3097560/",
    steam_app_id: 3097560,
    reason: "Game lừa bài 4 người, chơi cùng anh em chắc chắn có biến.",
  },
  {
    by: "mau02",
    name: "R.E.P.O.",
    source: "steam",
    url: "https://store.steampowered.com/app/3241660/",
    steam_app_id: 3241660,
    reason: "Co-op khiêng đồ trong nhà ma, hợp đội 4 người vừa sợ vừa cười.",
  },
  {
    by: "mau03",
    name: "Supermarket Together",
    source: "steam",
    url: "https://store.steampowered.com/app/2709570/",
    steam_app_id: 2709570,
    reason: "Giả lập mở siêu thị chơi nhóm, nối tiếp chuỗi game kinh doanh.",
  },
  {
    by: "mau04",
    name: "PEAK",
    source: "steam",
    url: "https://store.steampowered.com/app/3527290/",
    steam_app_id: 3527290,
    reason: "Leo núi co-op, cả đội phải kéo nhau lên đỉnh, rất hợp xem tối.",
  },
];
for (const s of SUGGESTIONS) {
  // Same Steam data a fan's submission gets (header image, price, genres), fetched live.
  const d = await fetchSteamDetails(s.steam_app_id).catch(() => undefined);
  // Offline / Steam unreachable: Steam's standard header path for the app, nothing else guessed.
  const steam_data = d
    ? { price: d.price, genres: d.genres, headerImage: d.headerImage }
    : { price: "Chưa rõ giá", genres: [], headerImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${s.steam_app_id}/header.jpg` };
  const exists = must("check", await db.from("suggestions").select("id").eq("author_id", ids[s.by]).eq("name", s.name).maybeSingle());
  if (exists) {
    if (steam_data) must(`steam ${s.name}`, await db.from("suggestions").update({ steam_data }).eq("id", exists.id));
    continue;
  }
  must(
    `suggestion ${s.name}`,
    await db
      .from("suggestions")
      .insert({ author_id: ids[s.by], name: s.name, source: s.source, url: s.url, steam_app_id: s.steam_app_id, steam_data, reason: s.reason, approved: true }),
  );
}
const sugIds = must(
  "sug ids",
  await db
    .from("suggestions")
    .select("id, name")
    .in(
      "name",
      SUGGESTIONS.map((s) => s.name),
    )
    .in("author_id", Object.values(ids)),
);
const votes = [];
sugIds.forEach((s, i) => FANS.slice(0, 6 - i).forEach((f) => votes.push({ suggestion_id: s.id, user_id: ids[f.handle] })));
must("votes", await db.from("suggestion_votes").upsert(votes, { onConflict: "suggestion_id,user_id", ignoreDuplicates: true }));
console.log(`Suggestions: ${sugIds.length} real games with ${votes.length} votes.`);

// ---- An open poll built from the most-voted real suggestions (0 votes: results are never invented) ----
{
  const question = "Buổi tới anh Độ nên thử game nào? (bình chọn mẫu)";
  const existing = must("poll check", await db.from("polls").select("id").eq("question", question).maybeSingle());
  if (!existing) {
    const top = must(
      "top suggestions",
      await db.from("suggestions").select("id, name").eq("approved", true).eq("hidden", false).order("upvotes", { ascending: false }).limit(4),
    );
    if (top.length >= 2) {
      const poll = must("poll", await db.from("polls").insert({ question, status: "open" }).select("id").single());
      must("poll options", await db.from("poll_options").insert(top.map((t, i) => ({ poll_id: poll.id, label: t.name, position: i, suggestion_id: t.id }))));
      console.log(`Poll: "${question}" with ${top.length} real games.`);
    }
  }
}

// ---- Fan songs: real tracks on SoundCloud (each URL verified through SoundCloud oEmbed) ----
for (const [i, s] of mockSongs.entries()) {
  const exists = must("song check", await db.from("fan_songs").select("id").eq("url", s.url).maybeSingle());
  if (exists) continue;
  must(
    `song ${s.title}`,
    await db.from("fan_songs").insert({
      author_id: ids[FANS[i % FANS.length].handle],
      title: s.title,
      artist: s.artist,
      url: s.url,
      note: s.note ?? null,
      thumbnail_url: s.thumbnailUrl ?? null,
      approved: true,
    }),
  );
}
console.log(`Fan songs: ${mockSongs.length} real tracks.`);

// ---- Wall: plain wishes from the sample fans, nothing about real events ----
const WALL = [
  ["mau01", "Chúc anh Độ và cả team luôn khỏe, mỗi buổi live đều vui, mạng khỏe, không lag!"],
  ["mau02", "Bộ Tộc điểm danh từ Hà Nội, tan làm là mở kênh chờ giờ lên sóng."],
  ["mau03", "Cảm ơn anh Độ vì những buổi stream giúp em bớt mệt sau giờ học."],
  ["mau05", "Hóng game mới quá, anh em nhớ vote đề xuất nhé!"],
];
for (const [by, body] of WALL) {
  const exists = must("wall check", await db.from("wall_messages").select("id").eq("author_id", ids[by]).eq("body", body).maybeSingle());
  if (!exists) must("wall", await db.from("wall_messages").insert({ author_id: ids[by], body, approved: true }));
}
console.log(`Wall: ${WALL.length} messages.`);
console.log("Done. Remove everything with: node scripts/seed-sample.mjs --remove");
