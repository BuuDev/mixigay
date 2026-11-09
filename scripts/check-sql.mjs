// Applies every migration plus seed.sql to an in-memory Postgres (PGlite) with
// the parts of Supabase the schema relies on stubbed (auth schema, roles,
// realtime publication), then asserts the RLS rules from docs/03-data-model.md.
// Run: npm run db:check. No Docker or Supabase CLI needed.
//
// When you add a table or policy, add an assertion below (see .claude/skills/db-change).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";

const root = new URL("../supabase/", import.meta.url).pathname;
const migrations = readdirSync(join(root, "migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const db = new PGlite({ extensions: { pg_trgm, unaccent } });
process.on("unhandledRejection", (e) => {
  console.error(`\n✗ unexpected error: ${e?.message ?? e}${e?.query ? `\n  in: ${e.query}` : ""}`);
  console.log("DB_CHECK=fail");
  process.exit(1);
});
let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};

// ----- Supabase stand-ins -----
await db.exec(`
  create schema extensions; create schema auth;
  create role anon; create role authenticated; create role service_role;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', email_confirmed_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create publication supabase_realtime;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  -- Supabase's default privileges: API roles get every new table/function at creation
  -- time, so a migration's later REVOKEs are what actually narrows access.
  grant usage on schema public, extensions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`);

console.log("Apply");
for (const file of migrations) {
  try {
    await db.exec(readFileSync(join(root, "migrations", file), "utf8"));
    ok(file);
  } catch (e) {
    bad(`${file}: ${e.message}`);
    process.exit(1);
  }
}
try {
  await db.exec(readFileSync(join(root, "seed.sql"), "utf8"));
  ok("seed.sql");
} catch (e) {
  bad(`seed.sql: ${e.message}`);
  process.exit(1);
}

const q = async (sql, params) => (await db.query(sql, params)).rows;
async function as(uid, fn) {
  await db.exec(`set role ${uid ? "authenticated" : "anon"}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}
async function allowed(label, fn) {
  try {
    await fn();
    ok(label);
  } catch (e) {
    bad(`${label}: ${e.message}`);
  }
}
/** Passes when the statement errors, or when an UPDATE/DELETE ... RETURNING touches no rows. */
async function denied(label, fn) {
  try {
    const rows = await fn();
    if (Array.isArray(rows) && rows.length === 0) ok(`${label} (0 rows)`);
    else bad(`${label}: was allowed`);
  } catch {
    ok(label);
  }
}
const eq = (label, actual, expected) =>
  JSON.stringify(actual) === JSON.stringify(expected) ? ok(label) : bad(`${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);

// ----- Users -----
// Own fixtures so assertions do not depend on whatever seed.sql contains.
await db.exec(`
  insert into public.games (slug, name) values ('fx-tetris', 'Tetris Bộ Tộc Fixture');
  insert into public.played_games (game_slug, status, sessions) values ('fx-tetris', 'playing', 1);
  insert into public.videos (video_id, title, published_at) values
    ('fxVid1', 'fixture 1', now()), ('fxVid2', 'fixture 2', now()), ('fxVid3', 'fixture 3', now());
`);

console.log("Users & admins");
const [fan] = await q(`insert into auth.users (email, raw_user_meta_data) values ('fan@example.com', '{"full_name":"Fan A"}') returning id`);
const [fan2] = await q(`insert into auth.users (email) values ('fan2@example.com') returning id`);
const [adm] = await q(`insert into auth.users (email) values ('admin@example.com') returning id`);
eq("profile created from sign-up metadata", (await q(`select display_name from public.profiles where id = $1`, [fan.id]))[0], { display_name: "Fan A" });
eq("profile stores no avatar or email", (await q(`select avatar_url from public.profiles where id = $1`, [fan.id]))[0], { avatar_url: null });
// Admins come only from invites (Accounts & invites below); fixtures insert them directly.
const [late] = await q(`insert into auth.users (email) values ('late@example.com') returning id`);
await q(`insert into public.admins (user_id) values ($1), ($2)`, [adm.id, late.id]);
await denied("the email-based admin list is gone", () => q(`insert into public.admin_emails values ('x@example.com')`));
const [longName] = await q(`insert into auth.users (email, raw_user_meta_data) values ('long@example.com', $1) returning id`, [JSON.stringify({ full_name: "x".repeat(80) })]);
eq("long Google names are truncated to 50", (await q(`select char_length(display_name) n from public.profiles where id = $1`, [longName.id]))[0].n, 50);
// Fixture fans are "old" accounts; the new-account limits are asserted under Moderation.
await q(`update public.profiles set created_at = now() - interval '3 days' where id = any($1::uuid[])`, [[fan.id, fan2.id, adm.id, late.id]]);

console.log("Profiles");
await allowed("fan renames themself", () => as(fan2.id, () => q(`update public.profiles set display_name = 'Fan B' where id = $1 returning id`, [fan2.id])));
await as(fan2.id, () => q(`update public.profiles set display_name = $2 where id = $1`, [fan2.id, "y".repeat(1000)]));
eq("a 1000-char name is cut to 50", (await q(`select char_length(display_name) n from public.profiles where id = $1`, [fan2.id]))[0].n, 50);
await as(fan2.id, () => q(`update public.profiles set display_name = 'Fan B' where id = $1`, [fan2.id]));
await denied("fan raises their own trust", () => as(fan2.id, () => q(`update public.profiles set trust = 2 where id = $1 returning id`, [fan2.id])));
await denied("fan changes avatar_url", () => as(fan2.id, () => q(`update public.profiles set avatar_url = 'https://evil.example/x.png' where id = $1 returning id`, [fan2.id])));
await denied("fan renames someone else", () => as(fan2.id, () => q(`update public.profiles set display_name = 'pwned' where id = $1 returning id`, [fan.id])));

// ----- Public content -----
console.log("Public content");
await allowed("anon reads schedule", () => as(null, () => q(`select * from public.schedule_slots`)));
await allowed("anon reads live_status", () => as(null, () => q(`select * from public.live_status`)));
await denied("fan edits schedule", () => as(fan.id, () => q(`update public.schedule_slots set title = 'x' returning id`)));
await denied("anon edits videos", () => as(null, () => q(`update public.videos set view_count = 0 returning video_id`)));
await allowed("admin edits schedule", async () => {
  const rows = await as(adm.id, () => q(`update public.schedule_slots set note = 'ok' returning id`));
  if (!rows.length) throw new Error("0 rows");
});

// ----- Suggestions & votes -----
console.log("Suggestions & votes");
// Lets the 10-minute posting cooldown pass for `uid` (rows stay inside the 24-hour window).
const coolDown = (uid) => q(`update public.suggestions set created_at = created_at - interval '11 minutes' where author_id = $1`, [uid]);
const [s1] = await as(fan.id, () =>
  q(`insert into public.suggestions (name, source, reason) values ('Bán Trà Sữa', 'other', 'vui lắm nè') returning id, name_normalized`),
);
eq("name normalized without diacritics", s1.name_normalized, "ban tra sua");
eq("new suggestion is invisible to other fans until approved", await as(fan2.id, () => q(`select id from public.suggestions where id = $1`, [s1.id])), []);
eq("new suggestion is invisible to anon", await as(null, () => q(`select id from public.suggestions where id = $1`, [s1.id])), []);
eq("author sees own pending suggestion", (await as(fan.id, () => q(`select id from public.suggestions where id = $1`, [s1.id]))).length, 1);
await denied("fan votes on an unapproved suggestion", () => as(fan2.id, () => q(`insert into public.suggestion_votes (suggestion_id) values ($1)`, [s1.id])));
await denied("fan approves own suggestion", () => as(fan.id, () => q(`update public.suggestions set approved = true where id = $1 returning id`, [s1.id])));
await denied("fan inserts an approved suggestion", () =>
  as(fan2.id, () => q(`insert into public.suggestions (name, source, reason, approved) values ('Self Approved', 'other', 'abcdef', true)`)),
);
await as(adm.id, () => q(`update public.suggestions set approved = true where id = $1`, [s1.id]));
eq("approved suggestion visible to anon", (await as(null, () => q(`select id from public.suggestions where id = $1`, [s1.id]))).length, 1);
await as(fan.id, () => q(`insert into public.suggestion_votes (suggestion_id) values ($1)`, [s1.id]));
await as(fan2.id, () => q(`insert into public.suggestion_votes (suggestion_id) values ($1)`, [s1.id]));
eq("vote trigger counts", (await q(`select upvotes from public.suggestions where id = $1`, [s1.id]))[0].upvotes, 2);
await as(fan2.id, () => q(`delete from public.suggestion_votes where suggestion_id = $1`, [s1.id]));
eq("unvote trigger counts", (await q(`select upvotes from public.suggestions where id = $1`, [s1.id]))[0].upvotes, 1);
await denied("fan creates an already-played suggestion", () =>
  as(fan.id, () => q(`insert into public.suggestions (name, source, reason, status) values ('Game X', 'other', 'abcdef', 'played')`)),
);
await denied("fan forges upvotes on insert", () =>
  as(fan.id, () => q(`insert into public.suggestions (name, source, reason, upvotes) values ('Game Y', 'other', 'abcdef', 999)`)),
);
await denied("fan writes steam_data directly", () =>
  as(fan2.id, () => q(`insert into public.suggestions (name, source, reason, steam_app_id, steam_data) values ('Dota', 'steam', 'abcdef', 570, '{}')`)),
);
await denied("fan reads other fans' votes", async () => {
  const rows = await as(fan2.id, () => q(`select user_id from public.suggestion_votes where user_id <> $1`, [fan2.id]));
  return rows;
});
await denied("fan votes as someone else", () => as(fan.id, () => q(`insert into public.suggestion_votes (suggestion_id, user_id) values ($1, $2)`, [s1.id, fan2.id])));
await denied("fan changes suggestion status", () => as(fan.id, () => q(`update public.suggestions set status = 'played' returning id`)));
await denied("anon inserts a suggestion", () => as(null, () => q(`insert into public.suggestions (name, source, reason) values ('Anon', 'other', 'abcdef')`)));
await denied("javascript: url", () =>
  as(fan2.id, () => q(`insert into public.suggestions (name, source, reason, url) values ('Url', 'other', 'abcdef', 'javascript:alert(1)')`)),
);
for (const name of ["Stardew Valley", "Hollow Knight", "Factorio", "Terraria"]) {
  await coolDown(fan.id);
  await as(fan.id, () => q(`insert into public.suggestions (name, source, reason) values ($1, 'other', 'abcdef')`, [name]));
}
await coolDown(fan.id);
await denied("6th suggestion within 24h", () => as(fan.id, () => q(`insert into public.suggestions (name, source, reason) values ('Game 99', 'other', 'abcdef')`)));

console.log("Duplicate suggestions");
const sug = (uid, name) => as(uid, () => q(`insert into public.suggestions (name, source, reason) values ($1, 'other', 'hay lắm mọi người')`, [name]));
const [lc] = await sug(fan2.id, "Lethal Company").then(() => q(`select id from public.suggestions where name_key = 'lethalcompany'`));
await q(`update public.suggestions set approved = true where id = $1`, [lc.id]);
await denied("same fan posts again within 10 minutes", () => sug(fan2.id, "Peak"));
await coolDown(fan2.id);
await denied("same fan re-posts the same game", () => sug(fan2.id, "Lethal Company"));
for (const variant of ["lethal company", "LETHAL  COMPANY!!", "Lethal-Company", "Lethal Companyy", "Lethal Cômpany"]) {
  await denied(`another fan posts variant “${variant}”`, () => sug(late.id, variant));
}
await allowed("a different game with a similar prefix is fine", () => sug(late.id, "Lethal League"));
eq("only one live copy of the game", (await q(`select count(*)::int n from public.suggestions where name_key = 'lethalcompany' and not hidden`))[0].n, 1);
await denied("name made only of symbols", async () => { await coolDown(late.id); return sug(late.id, "!!!"); });
await as(adm.id, () => q(`update public.suggestions set status = 'rejected' where name_key = 'lethalcompany'`));
await coolDown(late.id);
await allowed("after a rejection another fan may post the game again", () => sug(late.id, "Lethal Company"));
await coolDown(fan2.id);
await denied("…but the original author still cannot re-post it", () => sug(fan2.id, "lethal company"));
await allowed("admin hides and marks played", async () => {
  const rows = await as(adm.id, () => q(`update public.suggestions set status = 'played', hidden = true where id = $1 returning id`, [s1.id]));
  if (!rows.length) throw new Error("0 rows");
});
await denied("fan votes on a hidden suggestion", () => as(fan2.id, () => q(`insert into public.suggestion_votes (suggestion_id) values ($1)`, [s1.id])));
eq("hidden suggestion invisible to others", await as(fan2.id, () => q(`select id from public.suggestions where id = $1`, [s1.id])), []);
eq("hidden suggestion visible to its author", (await as(fan.id, () => q(`select id from public.suggestions where id = $1`, [s1.id]))).length, 1);
await denied("anon calls search_similar", () => as(null, () => q(`select * from public.search_similar('tetris')`)));
eq("search_similar finds played games", await as(fan2.id, () => q(`select kind, name, status from public.search_similar('tetris bo toc fixture')`)), [
  { kind: "game", name: "Tetris Bộ Tộc Fixture", status: "playing" },
]);

// ----- Operations -----
console.log("Operations");
eq("add_api_usage accumulates", [(await q(`select public.add_api_usage('videos', 1) n`))[0].n, (await q(`select public.add_api_usage('videos', 2) n`))[0].n], [1, 3]);
await denied("anon calls add_api_usage", () => as(null, () => q(`select public.add_api_usage('x', 1)`)));
await denied("fan calls set_playlist_members", () => as(fan.id, () => q(`select public.set_playlist_members('PL', array['x'])`)));
await denied("fan reads api_usage", () => as(fan.id, () => q(`select * from public.api_usage`)));
await allowed("admin reads api_usage", async () => {
  const rows = await as(adm.id, () => q(`select * from public.api_usage`));
  if (!rows.length) throw new Error("0 rows");
});
await allowed("fan may call set_auto_game", () =>
  as(fan.id, () => q(`select public.set_auto_game($1::jsonb)`, [JSON.stringify([{ video_id: "fxVid3", auto_game_slug: "pubg" }])])),
);
eq("set_auto_game by a fan changes nothing (RLS)", (await q(`select auto_game_slug from public.videos where video_id = 'fxVid3'`))[0].auto_game_slug, null);
await q(`select public.set_auto_game($1::jsonb)`, [JSON.stringify([{ video_id: "fxVid3", auto_game_slug: "vlog" }])]);
eq("set_auto_game by service role", (await q(`select auto_game_slug from public.videos where video_id = 'fxVid3'`))[0].auto_game_slug, "vlog");
await q(`select public.set_playlist_members('PL1', array['fxVid1','fxVid2'])`);
await q(`select public.set_playlist_members('PL1', array['fxVid2'])`);
eq(
  "set_playlist_members replaces membership",
  await q(`select video_id, playlist_ids from public.videos where video_id in ('fxVid1','fxVid2') order by 1`),
  [
    { video_id: "fxVid1", playlist_ids: [] },
    { video_id: "fxVid2", playlist_ids: ["PL1"] },
  ],
);
await denied("anon reads notifications_log", () => as(null, () => q(`select * from public.notifications_log`)));

// ----- Fan songs ("nhạc nịnh") -----
console.log("Fan songs");
const song = (title, url) => q(`insert into public.fan_songs (title, artist, url) values ($1, 'Fan', $2) returning id`, [title, url]);
const [s1row] = await as(fan2.id, () => song("Bài nịnh số 1", "https://soundcloud.com/fan/bai-1"));
await allowed("fan submits a song (pending)", async () => s1row.id);
eq("pending song invisible to others", await as(fan.id, () => q(`select id from public.fan_songs where id = $1`, [s1row.id])), []);
eq("pending song invisible to anon", await as(null, () => q(`select id from public.fan_songs where id = $1`, [s1row.id])), []);
eq("author sees own pending song", (await as(fan2.id, () => q(`select id from public.fan_songs where id = $1`, [s1row.id]))).length, 1);
await denied("fan self-approves on insert", () =>
  as(fan2.id, () => q(`insert into public.fan_songs (title, artist, url, approved) values ('X bài', 'Fan', 'https://soundcloud.com/fan/x', true)`)),
);
await denied("fan approves own song", () => as(fan2.id, () => q(`update public.fan_songs set approved = true where id = $1 returning id`, [s1row.id])));
await denied("anon submits", () => as(null, () => song("Anon bài", "https://soundcloud.com/fan/anon")));
await denied("non-music host", () => as(fan2.id, () => song("Lừa đảo", "https://evil.example/song")));
await denied("http (not https) link", () => as(fan2.id, () => song("Không https", "http://soundcloud.com/fan/y")));
await denied("link without a path", () => as(fan2.id, () => song("Trống", "https://youtube.com/")));
await denied("author deletes own pending song", () => as(fan2.id, () => q(`delete from public.fan_songs where id = $1 returning id`, [s1row.id])));
await as(fan2.id, () => song("Bài 2", "https://www.youtube.com/watch?v=abc"));
await as(fan2.id, () => song("Bài 3", "https://www.tiktok.com/@fan/video/1"));
await denied("4th song in a day", () => as(fan2.id, () => song("Bài 4", "https://open.spotify.com/track/1")));
eq("daily limit cannot be reset by deleting (author cannot delete)", (await as(fan2.id, () => q(`select count(*)::int n from public.fan_songs where author_id = $1`, [fan2.id])))[0].n, 3);
await allowed("admin approves", async () => {
  const rows = await as(adm.id, () => q(`update public.fan_songs set approved = true where id = $1 returning id`, [s1row.id]));
  if (!rows.length) throw new Error("0 rows");
});
// Another fan submits the same link: allowed while pending (cannot squat it)…
const [dup] = await as(fan.id, () => song("Bản sao", "https://SoundCloud.com/fan/bai-1"));
await allowed("pending copy of a published link is accepted", async () => dup.id);
// …but the admin cannot publish a second copy.
await denied("admin publishes a duplicate of a published link", () => as(adm.id, () => q(`update public.fan_songs set approved = true where id = $1 returning id`, [dup.id])));
eq("approved song visible to anon", (await as(null, () => q(`select id from public.fan_songs where id = $1`, [s1row.id]))).length, 1);
await denied("author deletes an approved song", async () => as(fan2.id, () => q(`delete from public.fan_songs where id = $1 returning id`, [s1row.id])));

// ----- Moderation (P0 anti-abuse) -----
console.log("Moderation");
const [newbie] = await q(`insert into auth.users (email, raw_user_meta_data) values ('new@example.com', '{"full_name":"Newbie"}') returning id`);
await as(newbie.id, () => sug(newbie.id, "Outer Wilds"));
await q(`update public.suggestions set created_at = created_at - interval '11 minutes' where author_id = $1`, [newbie.id]);
await as(newbie.id, () => sug(newbie.id, "Celeste"));
await coolDown(newbie.id);
await denied("account under 24h: 3rd suggestion of the day", () => sug(newbie.id, "Hades"));
const [pub] = await q(`select id from public.suggestions where name_key = 'lethalleague'`);
await q(`update public.suggestions set approved = true where id = $1`, [pub.id]);
await denied("account under 24h cannot vote", () => as(newbie.id, () => q(`insert into public.suggestion_votes (suggestion_id) values ($1)`, [pub.id])));
await allowed("aged account votes on an approved suggestion", () => as(fan2.id, () => q(`insert into public.suggestion_votes (suggestion_id) values ($1)`, [pub.id])));
// Unreviewed rows must not reserve names (a troll could squat upcoming games)…
await allowed("another fan's PENDING suggestion does not block the name", async () => { await coolDown(late.id); return sug(late.id, "Outer  Wilds!"); });
await coolDown(newbie.id);
await denied("…but the author's own pending copy does", () => sug(newbie.id, "Outer Wilds 2"));
await as(adm.id, () => q(`update public.suggestions set approved = true where author_id = $1 and name_key = 'outerwilds'`, [newbie.id]));
await denied("admin cannot publish a second live copy of a name", () =>
  as(adm.id, () => q(`update public.suggestions set approved = true where author_id = $1 and name_key = 'outerwilds' returning id`, [late.id])),
);

const nameOf = async (id) => (await q(`select display_name from public.profiles where id = $1`, [id]))[0].display_name;
for (const [label, name] of [
  ["gambling brand in name", "NHACAI 789club uy tín"],
  ["domain in name", "Vào fb88 . com nhận quà"],
  ["url in name", "https://x.example"],
  ["only invisible characters", "\u200b\u200b\u3164"],
  ["spaced-out profanity", "đ.m.m fan cứng"],
]) {
  await as(newbie.id, () => q(`update public.profiles set display_name = $2 where id = $1`, [newbie.id, name]));
  eq(`display name sanitized: ${label}`, (await nameOf(newbie.id)).startsWith("Fan "), true);
}
await as(newbie.id, () => q(`update public.profiles set display_name = $2 where id = $1`, [newbie.id, "Lươn Cao Bằng\u200b fan"]));
eq("normal name kept, invisible chars stripped", await nameOf(newbie.id), "Lươn Cao Bằng fan");
const [spamUser] = await q(`insert into auth.users (email, raw_user_meta_data) values ('spam@example.com', '{"full_name":"KUBET khuyến mãi"}') returning id`);
eq("ad in the Google name is replaced at sign-up", (await nameOf(spamUser.id)).startsWith("Fan "), true);

for (const [label, url] of [
  ["http link", "http://store.steampowered.com/app/1"],
  ["userinfo trick", "https://store.steampowered.com@evil.example/app"],
  ["punycode host", "https://xn--stem-xxa.com/app"],
  ["link shortener", "https://bit.ly/abc"],
  ["over 500 chars", `https://store.steampowered.com/${"a".repeat(500)}`],
]) {
  await denied(`suggestion url rejected: ${label}`, async () => {
    await coolDown(late.id);
    return as(late.id, () => q(`insert into public.suggestions (name, source, reason, url) values ($1, 'other', 'hay lắm mọi người', $2)`, [`Url ${label}`, url]));
  });
}
await denied("zero-width padding cannot fake a long reason", async () => {
  await coolDown(late.id);
  return as(late.id, () => q(`insert into public.suggestions (name, source, reason) values ('Padding', 'other', $1)`, ["ab\u200b\u200b\u200b\u200b\u200b"]));
});

await denied("fan calls moderate_user", () => as(fan.id, () => q(`select public.moderate_user($1, 'ban')`, [fan2.id])));
await denied("fan calls reset_display_name", () => as(fan.id, () => q(`select public.reset_display_name($1)`, [fan2.id])));
await as(adm.id, () => q(`select public.moderate_user($1, 'ban')`, [late.id]));
eq("ban hides everything the user posted", (await q(`select count(*)::int n from public.suggestions where author_id = $1 and not hidden`, [late.id]))[0].n, 0);
await denied("banned fan cannot post", async () => { await coolDown(late.id); return sug(late.id, "Banned Game"); });
await denied("banned fan cannot submit songs", () => as(late.id, () => song("Bài bị cấm", "https://soundcloud.com/fan/banned")));
await denied("banned fan cannot vote", () => as(late.id, () => q(`insert into public.suggestion_votes (suggestion_id) values ($1)`, [s1.id])));
await as(adm.id, () => q(`select public.moderate_user($1, 'shadow')`, [newbie.id]));
eq("shadow ban withdraws the user's votes", (await q(`select count(*)::int n from public.suggestion_votes where user_id = $1`, [newbie.id]))[0].n, 0);
eq("shadow-banned fan still sees own posts", (await as(newbie.id, () => q(`select id from public.suggestions where author_id = $1`, [newbie.id]))).length, 2);
await q(`update public.profiles set created_at = now() - interval '3 days' where id = $1`, [newbie.id]);
await q(`update public.suggestions set created_at = now() - interval '2 days' where author_id = $1`, [newbie.id]);
await as(newbie.id, () => sug(newbie.id, "Shadow Game"));
eq("shadow-banned post is born hidden", (await q(`select hidden from public.suggestions where author_id = $1 and name_key = 'shadowgame'`, [newbie.id]))[0].hidden, true);
await allowed("shadow-banned vote reports success…", () => as(newbie.id, () => q(`insert into public.suggestion_votes (suggestion_id) values ($1)`, [pub.id])));
eq("…but is not stored", (await q(`select count(*)::int n from public.suggestion_votes where user_id = $1`, [newbie.id]))[0].n, 0);
await denied("admin cannot publish a shadow-banned author's post", () =>
  as(adm.id, () => q(`update public.suggestions set approved = true where author_id = $1 and name_key = 'shadowgame' returning id`, [newbie.id])),
);
await denied("fan reads anyone's trust", () => as(newbie.id, () => q(`select trust from public.profiles where id = $1`, [newbie.id])));
await allowed("anon still reads public profile columns", () => as(null, () => q(`select id, display_name, avatar_url from public.profiles limit 1`)));
await denied("fan inserts a profile row", () => as(fan.id, () => q(`insert into public.profiles (id, display_name, trust) values (gen_random_uuid(), 'x', 2)`)));
eq("…which nobody else sees", (await as(fan.id, () => q(`select id from public.suggestions where author_id = $1`, [newbie.id]))).length, 0);
await as(adm.id, () => q(`select public.moderate_user($1, 'unban')`, [late.id]));
eq("unban restores trust 0", (await q(`select trust from public.profiles where id = $1`, [late.id]))[0].trust, 0);
await denied("fan reads banned_terms", () => as(fan.id, () => q(`select * from public.banned_terms`)));

// ----- Fan art (Google Drive share links) -----
console.log("Fan art");
const art = (title, fileId, url = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`) =>
  q(`insert into public.fan_art (title, artist, drive_url, drive_file_id) values ($1, 'Họa sĩ Bộ Tộc', $2, $3) returning id`, [title, url, fileId]);
const [a1] = await as(fan.id, () => art("Tranh Tộc Trưởng 1", "1AbCdEfGhIjKlMnOpQrStUvWxYz012345"));
await allowed("fan submits fan art via Google Drive link (pending)", async () => a1.id);
eq("pending fan art invisible to others", await as(fan2.id, () => q(`select id from public.fan_art where id = $1`, [a1.id])), []);
eq("pending fan art invisible to anon", await as(null, () => q(`select id from public.fan_art where id = $1`, [a1.id])), []);
eq("author sees own pending fan art", (await as(fan.id, () => q(`select id from public.fan_art where id = $1`, [a1.id]))).length, 1);
await denied("fan self-approves fan art on insert", () =>
  as(fan.id, () => q(`insert into public.fan_art (title, artist, drive_url, drive_file_id, approved) values ('X tranh', 'Fan', 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz999999/view', '1AbCdEfGhIjKlMnOpQrStUvWxYz999999', true)`)),
);
await denied("fan approves own fan art", () => as(fan.id, () => q(`update public.fan_art set approved = true where id = $1 returning id`, [a1.id])));
await denied("anon submits fan art", () => as(null, () => art("Anon tranh", "1AbCdEfGhIjKlMnOpQrStUvWxYz888888")));
await denied("non-Drive host rejected", () => as(fan.id, () => art("Link ngoài", "1AbCdEfGhIjKlMnOpQrStUvWxYz777777", "https://imgur.com/1AbCdEfGhIjKlMnOpQrStUvWxYz777777")));
await denied("invalid drive_file_id rejected", () => as(fan.id, () => art("ID ngắn", "short")));
await denied("author deletes own fan art", () => as(fan.id, () => q(`delete from public.fan_art where id = $1 returning id`, [a1.id])));
await allowed("admin approves fan art", async () => {
  const rows = await as(adm.id, () => q(`update public.fan_art set approved = true where id = $1 returning id`, [a1.id]));
  if (!rows.length) throw new Error("0 rows");
});
eq("approved fan art visible to anon", (await as(null, () => q(`select id from public.fan_art where id = $1`, [a1.id]))).length, 1);
const [dupArt] = await as(fan2.id, () => art("Bản sao tranh", "1AbCdEfGhIjKlMnOpQrStUvWxYz012345"));
await allowed("pending duplicate drive_file_id allowed", async () => dupArt.id);
await denied("admin publishes duplicate drive_file_id", () => as(adm.id, () => q(`update public.fan_art set approved = true where id = $1 returning id`, [dupArt.id])));

// ----- Quiz questions (fan-contributed) -----
console.log("Quiz questions");
const quizInsert = (question, correctIndex = 1) =>
  q(
    `insert into public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_index, explanation) values ($1, 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', $2, 'Giải thích rõ ràng') returning id`,
    [question, correctIndex],
  );
const [q1] = await as(fan.id, () => quizInsert("Khung giờ lên sóng quen thuộc của anh Độ Mixi là mấy giờ?"));
await allowed("fan submits a quiz question (pending)", async () => q1.id);
eq("pending quiz question invisible to others", await as(fan2.id, () => q(`select id from public.quiz_questions where id = $1`, [q1.id])), []);
eq("pending quiz question invisible to anon", await as(null, () => q(`select id from public.quiz_questions where id = $1`, [q1.id])), []);
eq("author sees own pending quiz question", (await as(fan.id, () => q(`select id from public.quiz_questions where id = $1`, [q1.id]))).length, 1);
await denied("fan self-approves quiz question", () =>
  as(fan.id, () =>
    q(
      `insert into public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_index, approved) values ('Câu hỏi tự duyệt dài hơn 10 ký tự?', 'A', 'B', 'C', 'D', 0, true)`,
    ),
  ),
);
await denied("correct_index out of range rejected", () => as(fan.id, () => quizInsert("Câu hỏi có đáp án ngoài phạm vi 0..3?", 5)));
await denied("question too short rejected", () => as(fan.id, () => quizInsert("Ngắn?")));
await allowed("admin approves quiz question", async () => {
  const rows = await as(adm.id, () => q(`update public.quiz_questions set approved = true where id = $1 returning id`, [q1.id]));
  if (!rows.length) throw new Error("0 rows");
});
eq("approved quiz question visible to anon", (await as(null, () => q(`select id from public.quiz_questions where id = $1`, [q1.id]))).length, 1);

// ----- Reports, fan song votes, Steam budget (20261110110000) -----
console.log("Reports");
// No RETURNING: reporters may not read reports back, so RETURNING would trip RLS.
const report = (uid, kind, id, reason = "spam") => as(uid, () => q(`insert into public.reports (target_kind, target_id, reason) values ($1, $2, $3)`, [kind, id, reason]));
await allowed("fan reports a published suggestion", () => report(fan.id, "suggestion", lc.id));
await denied("same fan reports it twice", () => report(fan.id, "suggestion", lc.id, "gambling"));
await allowed("fan reports a published song", () => report(fan.id, "fan_song", s1row.id, "offensive"));
await allowed("fan reports a display name", () => report(fan.id, "profile", fan2.id, "impersonation"));
await denied("report on a target that does not exist", () => report(fan.id, "suggestion", "00000000-0000-0000-0000-000000000000"));
await denied("report with an unknown reason", () => report(fan2.id, "suggestion", lc.id, "boring"));
await denied("anon reports", () => report(null, "suggestion", lc.id));
await denied("banned fan reports", async () => {
  await as(adm.id, () => q(`select public.moderate_user($1, 'ban')`, [late.id]));
  try {
    return await report(late.id, "suggestion", lc.id);
  } finally {
    await as(adm.id, () => q(`select public.moderate_user($1, 'unban')`, [late.id]));
  }
});
eq("reporter cannot read reports back", await as(fan.id, () => q(`select id from public.reports`)), []);
eq("admin sees reports", (await as(adm.id, () => q(`select id from public.reports`))).length, 3);
await denied("fan resolves a report", () => as(fan.id, () => q(`update public.reports set resolved = true returning id`)));
await allowed("admin resolves a report", async () => {
  const rows = await as(adm.id, () => q(`update public.reports set resolved = true where target_kind = 'profile' returning id`));
  if (!rows.length) throw new Error("0 rows");
});

console.log("Fan song votes");
const songVote = (uid, id) => as(uid, () => q(`insert into public.fan_song_votes (song_id) values ($1)`, [id]));
await allowed("aged fan votes for a published song", () => songVote(fan.id, s1row.id));
await denied("same fan votes twice", () => songVote(fan.id, s1row.id));
await denied("vote for a pending song", () => songVote(fan.id, dup.id));
eq("song vote is counted", (await q(`select upvotes from public.fan_songs where id = $1`, [s1row.id]))[0].upvotes, 1);
await as(fan.id, () => q(`delete from public.fan_song_votes where song_id = $1`, [s1row.id]));
eq("song unvote is counted", (await q(`select upvotes from public.fan_songs where id = $1`, [s1row.id]))[0].upvotes, 0);
await denied("fan forges song upvotes", () => as(fan.id, () => q(`update public.fan_songs set upvotes = 999 where id = $1 returning id`, [s1row.id])));
await allowed("shadow-banned song vote reports success…", () => songVote(newbie.id, s1row.id));
eq("…but is not stored", (await q(`select count(*)::int n from public.fan_song_votes where user_id = $1`, [newbie.id]))[0].n, 0);
const [freshFan] = await q(`insert into auth.users (email) values ('fresh@example.com') returning id`);
await denied("account under 24h cannot vote for songs", () => songVote(freshFan.id, s1row.id));

console.log("Steam lookup budget");
const steamTake = (uid) => as(uid, () => q(`select public.take_steam_lookup() ok`)).then((r) => r[0].ok);
const takes = [];
for (let i = 0; i < 21; i++) takes.push(await steamTake(fan2.id));
eq("20 Steam lookups per 10 minutes, the 21st is refused", [takes.slice(0, 20).every(Boolean), takes[20]], [true, false]);
eq("another fan has their own budget", await steamTake(fan.id), true);
await denied("anon cannot take a Steam lookup", () => as(null, () => q(`select public.take_steam_lookup()`)));
await denied("fan reads steam_lookups", async () => {
  const rows = await as(fan.id, () => q(`select * from public.steam_lookups`));
  if (rows.length) return rows;
  throw new Error("no access");
});

// ----- Private accounts: invites, owner, verified badge, reserved names (20261110120000) -----
console.log("Accounts & invites");
const nameOf2 = async (id) => (await q(`select display_name from public.profiles where id = $1`, [id]))[0].display_name;
// The server creates auth users itself (public sign-up is off); simulate that here.
const serverCreateUser = async (handle, displayName) => {
  const [u] = await q(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [`u-${handle}@id.gocbotoc.invalid`, JSON.stringify({ full_name: displayName })]);
  await q(`insert into public.account_logins (handle_key, user_id, auth_email) values (public.name_key($1), $2, $3)`, [handle, u.id, `u-${handle}@id.gocbotoc.invalid`]);
  return u;
};

for (const [label, name] of [["Cyrillic look-alikes", "Dоmіxі"], ["digit swaps", "D0 M1x1"], ["“Official” suffix", "Độ Mixi Official"], ["MixiGaming", "MixiGaming chính thức"], ["Tộc Trưởng", "Tộc Trưởng"], ["spaced out", "Đ ộ M i x i"], ["admin", "Admin Bộ Tộc"]]) {
  const u = await serverCreateUser(`imp${label.length}${name.length}`, name);
  eq(`reserved name refused at sign-up: ${label}`, (await nameOf2(u.id)).startsWith("Fan "), true);
}
const plainFan = await serverCreateUser("botocmixi", "Bộ Tộc Mixi");
eq("ordinary fan names with “Mixi” stay", await nameOf2(plainFan.id), "Bộ Tộc Mixi");
await as(plainFan.id, () => q(`update public.profiles set display_name = 'Dоmіxі' where id = $1`, [plainFan.id]));
eq("renaming to a look-alike is refused too", (await nameOf2(plainFan.id)).startsWith("Fan "), true);
await denied("fan grants themself the badge", () => as(plainFan.id, () => q(`update public.profiles set verified = true where id = $1 returning id`, [plainFan.id])));

for (const [label, sql] of [
  ["account_logins", "select * from public.account_logins"],
  ["invites", "select * from public.invites"],
  ["auth_attempts", "select * from public.auth_attempts"],
  ["peek_invite", "select * from public.peek_invite('x')"],
  ["consume_invite", `select public.consume_invite('x', '${plainFan.id}')`],
  ["take_auth_attempt", "select public.take_auth_attempt('login_ip', 'k', 5, interval '1 minute')"],
]) {
  await denied(`fan cannot use ${label}`, async () => {
    const rows = await as(plainFan.id, () => q(sql));
    if (rows.length) return rows;
    throw new Error("no rows");
  });
}
await denied("anon cannot issue invites", () => as(null, () => q(`select public.issue_invite('owner', 'x', 'x')`)));
await denied("fan cannot issue invites", () => as(plainFan.id, () => q(`select public.issue_invite('admin', 'mod1', 'Mod')`)));
await denied("a plain admin cannot issue invites", () => as(adm.id, () => q(`select public.issue_invite('official', 'domixi', 'Độ Mixi')`)));

// Bootstrap: the first owner invite comes from the SQL editor (no JWT).
const [{ t: ownerToken }] = await q(`select public.issue_invite('owner', 'Chủ Trang', 'Chủ trang') t`);
eq("invite token is long and random", /^[0-9a-f]{64}$/.test(ownerToken), true);
eq("only the token hash is stored", (await q(`select count(*)::int n from public.invites where token_hash = $1`, [ownerToken]))[0].n, 0);
eq("peek shows what the invite is for", (await q(`select role, handle_key from public.peek_invite($1)`, [ownerToken]))[0], { role: "owner", handle_key: "chutrang" });
const owner = await serverCreateUser("chutrang", "Chủ trang");
await q(`select public.consume_invite($1, $2)`, [ownerToken, owner.id]);
eq("owner invite makes an owner admin", (await q(`select owner from public.admins where user_id = $1`, [owner.id]))[0].owner, true);
await denied("an invite works only once", () => q(`select public.consume_invite($1, $2)`, [ownerToken, plainFan.id]));
await denied("owner cannot issue another owner invite", () => as(owner.id, () => q(`select public.issue_invite('owner', 'owner2', 'Owner 2')`)));

const [{ t: offToken }] = await as(owner.id, () => q(`select public.issue_invite('official', 'domixi', 'Độ Mixi') t`));
await denied("handle already promised to an open invite", () => as(owner.id, () => q(`select public.issue_invite('admin', 'Đọ Mixi', 'x')`)));
const official = await serverCreateUser("domixi", "Độ Mixi");
eq("before redeeming, even the invited account cannot use the reserved name", (await nameOf2(official.id)).startsWith("Fan "), true);
await q(`select public.consume_invite($1, $2)`, [offToken, official.id]);
eq("official invite: admin + badge + real name", (await q(`select p.verified, p.display_name, exists (select 1 from public.admins a where a.user_id = p.id) adm from public.profiles p where id = $1`, [official.id]))[0], { verified: true, display_name: "Độ Mixi", adm: true });
eq("anyone can read the badge", (await as(null, () => q(`select verified from public.profiles where id = $1`, [official.id])))[0].verified, true);

const [{ t: oldToken }] = await as(owner.id, () => q(`select public.issue_invite('admin', 'mod2', 'Mod 2') t`));
await q(`update public.invites set expires_at = now() - interval '1 minute' where token_hash = public.token_hash($1)`, [oldToken]);
await denied("an expired invite is refused", () => q(`select public.consume_invite($1, $2)`, [oldToken, plainFan.id]));

const access = await as(owner.id, () => q(`select kind, display_name, role from public.list_access() where display_name = 'Độ Mixi'`));
eq("owner sees admins by name and role, no email", access, [{ kind: "admin", display_name: "Độ Mixi", role: "official" }]);
await denied("a plain admin cannot list access", () => as(adm.id, () => q(`select * from public.list_access()`)));
await denied("a plain admin cannot remove admins", () => as(adm.id, () => q(`select public.remove_admin($1)`, [official.id])));
await denied("owner cannot remove themself", () => as(owner.id, () => q(`select public.remove_admin($1)`, [owner.id])));
await as(owner.id, () => q(`select public.remove_admin($1)`, [official.id]));
eq("removal takes role and badge away", (await q(`select verified, exists (select 1 from public.admins a where a.user_id = p.id) adm from public.profiles p where id = $1`, [official.id]))[0], { verified: false, adm: false });
eq("…and the reserved name with them", (await nameOf2(official.id)).startsWith("Fan "), true);

const tries = [];
for (let i = 0; i < 4; i++) tries.push((await q(`select public.take_auth_attempt('login_handle', 'abc', 3, interval '10 minutes') ok`))[0].ok);
eq("auth attempts are capped", tries, [true, true, true, false]);

console.log("Account hardening");
await denied("swapping the synthetic address for a real email is refused", () => q(`update auth.users set email = 'anh.do@gmail.com' where id = $1`, [plainFan.id]));
await allowed("a new synthetic address is fine", () => q(`update auth.users set email = $2 where id = $1`, [plainFan.id, `u-${"0".repeat(8)}-0000-0000-0000-${"0".repeat(12)}@id.gocbotoc.invalid`]));
for (const fn of ["public.is_reserved_name('domixi')", "public.auth_attempts_exceeded('login_ip', 'k', 1, interval '1 minute')", "public.note_auth_failure('login_ip', 'k')"]) {
  await denied(`anon cannot call ${fn.split("(")[0]}`, () => as(null, () => q(`select ${fn}`)));
}
await q(`select public.note_auth_failure('login_handle_ip', 'h|ip')`);
await q(`select public.note_auth_failure('login_handle_ip', 'h|ip')`);
eq("failures are counted per handle+IP", [(await q(`select public.auth_attempts_exceeded('login_handle_ip', 'h|ip', 2, interval '10 minutes') x`))[0].x, (await q(`select public.auth_attempts_exceeded('login_handle_ip', 'h|other', 2, interval '10 minutes') x`))[0].x], [true, false]);

// ----- Wall, attendance, live_samples compaction (20261110130000) -----
console.log("Wall messages");
const wall = (uid, body) => as(uid, () => q(`insert into public.wall_messages (body) values ($1)`, [body]));
await allowed("fan writes on the wall (pending)", () => wall(fan.id, "Chúc anh Độ stream vui nha!"));
const [w1] = await q(`select id from public.wall_messages where author_id = $1`, [fan.id]);
eq("pending message invisible to others", await as(fan2.id, () => q(`select id from public.wall_messages where id = $1`, [w1.id])), []);
eq("pending message invisible to anon", await as(null, () => q(`select id from public.wall_messages where id = $1`, [w1.id])), []);
eq("author sees own pending message", (await as(fan.id, () => q(`select id from public.wall_messages where id = $1`, [w1.id]))).length, 1);
await denied("message over 140 characters", () => wall(fan2.id, "x".repeat(141)));
await denied("message of invisible characters only", () => wall(fan2.id, "\u200b\u200b\u200b"));
await denied("fan self-approves on insert", () => as(fan2.id, () => q(`insert into public.wall_messages (body, approved) values ('Tự duyệt', true)`)));
await denied("fan approves own message", () => as(fan.id, () => q(`update public.wall_messages set approved = true where id = $1 returning id`, [w1.id])));
await denied("author deletes own message", () => as(fan.id, () => q(`delete from public.wall_messages where id = $1 returning id`, [w1.id])));
await denied("anon writes on the wall", () => wall(null, "Khách vãng lai"));
await wall(fan.id, "Tin thứ hai");
await wall(fan.id, "Tin thứ ba");
await denied("4th message in a day", () => wall(fan.id, "Tin thứ tư"));
await allowed("admin approves a message", async () => {
  const rows = await as(adm.id, () => q(`update public.wall_messages set approved = true where id = $1 returning id`, [w1.id]));
  if (!rows.length) throw new Error("0 rows");
});
eq("approved message visible to anon", (await as(null, () => q(`select body from public.wall_messages where id = $1`, [w1.id])))[0], { body: "Chúc anh Độ stream vui nha!" });
const fresh2 = await serverCreateUser("wallnewbie", "Wall Newbie");
await wall(fresh2.id, "Tin đầu tiên");
await denied("account under 24h: 2nd message", () => wall(fresh2.id, "Tin thứ hai"));
await as(adm.id, () => q(`select public.moderate_user($1, 'shadow')`, [fresh2.id]));
const [fw] = await q(`select id from public.wall_messages where author_id = $1`, [fresh2.id]);
await denied("admin cannot publish a shadow-banned author's message", () => as(adm.id, () => q(`update public.wall_messages set approved = true where id = $1 returning id`, [fw.id])));

console.log("Attendance");
const today = (await q(`select public.today_vn()::text d`))[0].d;
const attend = (uid, d = today) => as(uid, () => q(`insert into public.attendance (date_vn) values ($1)`, [d]));
await allowed("fan taps “Tối nay tôi có mặt”", () => attend(fan.id));
await denied("same fan taps twice", () => attend(fan.id));
await denied("tap for another day", () => attend(fan2.id, "2020-01-01"));
await denied("anon taps", () => attend(null));
await allowed("second fan taps", () => attend(fan2.id));
await allowed("shadow-banned tap reports success…", () => attend(fresh2.id));
eq("…and the public count excludes it", (await as(null, () => q(`select public.attendance_count($1::date) n`, [today])))[0].n, 2);
eq("fans cannot list who attends", (await as(fan2.id, () => q(`select user_id from public.attendance`))).length, 1);
await as(fan2.id, () => q(`delete from public.attendance where user_id = $1`, [fan2.id]));
eq("un-tap lowers the count", (await q(`select public.attendance_count($1::date) n`, [today]))[0].n, 1);

console.log("live_samples compaction");
await q(`insert into public.live_samples (video_id, sampled_at, concurrent_viewers)
  select 'fxVid1', timestamptz '2026-01-01 12:00:00+00' + make_interval(mins => m), 1000 + m from generate_series(0, 14) m`);
await q(`insert into public.live_samples (video_id, sampled_at, concurrent_viewers) values ('fxVid1', now() - interval '1 hour', 5), ('fxVid1', now() - interval '59 minutes', 6)`);
eq("compaction keeps one sample per 5 minutes after 30 days", (await q(`select public.compact_live_samples() n`))[0].n, 12);
eq("…and leaves recent samples alone", (await q(`select count(*)::int n from public.live_samples where sampled_at > now() - interval '2 hours'`))[0].n, 2);
await denied("fan cannot run compaction", () => as(fan.id, () => q(`select public.compact_live_samples()`)));

console.log(failures ? `\nDB_CHECK=fail (${failures})` : "\nDB_CHECK=pass");
process.exit(failures ? 1 : 0);
