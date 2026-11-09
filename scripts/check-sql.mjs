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
console.log("Users & admins");
await db.exec(`insert into public.admin_emails values ('admin@example.com')`);
const [fan] = await q(`insert into auth.users (email, raw_user_meta_data) values ('fan@example.com', '{"full_name":"Fan A"}') returning id`);
const [fan2] = await q(`insert into auth.users (email) values ('fan2@example.com') returning id`);
const [adm] = await q(`insert into auth.users (email) values ('ADMIN@example.com') returning id`);
eq("profile created from Google metadata", (await q(`select display_name from public.profiles where id = $1`, [fan.id]))[0], { display_name: "Fan A" });
eq("admin granted by email (case-insensitive)", (await q(`select count(*)::int n from public.admins`))[0].n, 1);
const [late] = await q(`insert into auth.users (email) values ('late@example.com') returning id`);
await db.exec(`insert into public.admin_emails values ('late@example.com')`);
eq("admin granted when email added after sign-up", (await q(`select count(*)::int n from public.admins where user_id = $1`, [late.id]))[0].n, 1);
// An attacker signs up with email/password using an admin's address; the email is never confirmed.
await db.exec(`insert into public.admin_emails values ('boss@example.com')`);
const [squatter] = await q(`insert into auth.users (email, email_confirmed_at) values ('boss@example.com', null) returning id`);
eq("unconfirmed email does not become admin", (await q(`select count(*)::int n from public.admins where user_id = $1`, [squatter.id]))[0].n, 0);
await db.exec(`insert into public.admin_emails values ('boss2@example.com')`);
const [squatter2] = await q(`insert into auth.users (email, email_confirmed_at) values ('boss2@example.com', null) returning id`);
eq("listing an email later skips unconfirmed accounts", (await q(`select count(*)::int n from public.admins where user_id = $1`, [squatter2.id]))[0].n, 0);
await q(`update auth.users set email_confirmed_at = now() where id = $1`, [squatter.id]);
eq("admin granted once the email is confirmed", (await q(`select count(*)::int n from public.admins where user_id = $1`, [squatter.id]))[0].n, 1);
const [longName] = await q(`insert into auth.users (email, raw_user_meta_data) values ('long@example.com', $1) returning id`, [JSON.stringify({ full_name: "x".repeat(80) })]);
eq("long Google names are truncated to 50", (await q(`select char_length(display_name) n from public.profiles where id = $1`, [longName.id]))[0].n, 50);

console.log("Profiles");
await allowed("fan renames themself", () => as(fan2.id, () => q(`update public.profiles set display_name = 'Fan B' where id = $1 returning id`, [fan2.id])));
await denied("fan sets a 1000-char name", () => as(fan2.id, () => q(`update public.profiles set display_name = $2 where id = $1 returning id`, [fan2.id, "y".repeat(1000)])));
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
const [s1] = await as(fan.id, () =>
  q(`insert into public.suggestions (name, source, reason) values ('Bán Trà Sữa', 'other', 'vui lắm nè') returning id, name_normalized`),
);
eq("name normalized without diacritics", s1.name_normalized, "ban tra sua");
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
for (let i = 0; i < 4; i++) await as(fan.id, () => q(`insert into public.suggestions (name, source, reason) values ($1, 'other', 'abcdef')`, [`Game ${i}`]));
await denied("6th suggestion within 24h", () => as(fan.id, () => q(`insert into public.suggestions (name, source, reason) values ('Game 99', 'other', 'abcdef')`)));
await allowed("admin hides and marks played", async () => {
  const rows = await as(adm.id, () => q(`update public.suggestions set status = 'played', hidden = true where id = $1 returning id`, [s1.id]));
  if (!rows.length) throw new Error("0 rows");
});
await denied("fan votes on a hidden suggestion", () => as(fan2.id, () => q(`insert into public.suggestion_votes (suggestion_id) values ($1)`, [s1.id])));
eq("hidden suggestion invisible to others", await as(fan2.id, () => q(`select id from public.suggestions where id = $1`, [s1.id])), []);
eq("hidden suggestion visible to its author", (await as(fan.id, () => q(`select id from public.suggestions where id = $1`, [s1.id]))).length, 1);
eq("search_similar finds played games", await as(null, () => q(`select kind, name, status from public.search_similar('pubg')`)), [
  { kind: "game", name: "PUBG", status: "playing" },
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
  as(fan.id, () => q(`select public.set_auto_game($1::jsonb)`, [JSON.stringify([{ video_id: "demoVid0009", auto_game_slug: "pubg" }])])),
);
eq("set_auto_game by a fan changes nothing (RLS)", (await q(`select auto_game_slug from public.videos where video_id = 'demoVid0009'`))[0].auto_game_slug, null);
await q(`select public.set_auto_game($1::jsonb)`, [JSON.stringify([{ video_id: "demoVid0009", auto_game_slug: "vlog" }])]);
eq("set_auto_game by service role", (await q(`select auto_game_slug from public.videos where video_id = 'demoVid0009'`))[0].auto_game_slug, "vlog");
await q(`select public.set_playlist_members('PL1', array['demoVid0001','demoVid0002'])`);
await q(`select public.set_playlist_members('PL1', array['demoVid0002'])`);
eq(
  "set_playlist_members replaces membership",
  await q(`select video_id, playlist_ids from public.videos where video_id in ('demoVid0001','demoVid0002') order by 1`),
  [
    { video_id: "demoVid0001", playlist_ids: [] },
    { video_id: "demoVid0002", playlist_ids: ["PL1"] },
  ],
);
await denied("anon reads notifications_log", () => as(null, () => q(`select * from public.notifications_log`)));

console.log(failures ? `\nDB_CHECK=fail (${failures})` : "\nDB_CHECK=pass");
process.exit(failures ? 1 : 0);
