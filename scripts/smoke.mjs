// Builds and starts the app in "Supabase configured" mode against a local stub
// of Supabase's REST/Auth API, then checks every route as an anonymous visitor:
// pages render real (stub) data, admin pages 404 without streaming content,
// cron routes demand the secret, redirects stay on-site.
// Run: npm run smoke   (add --no-build to reuse the last build)
import { spawn } from "node:child_process";
import http from "node:http";

const STUB_PORT = 54399;
const APP_PORT = 3123;
const APP = `http://127.0.0.1:${APP_PORT}`;
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${STUB_PORT}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "stub-anon",
  CRON_SECRET: "smoke-secret",
  // Jobs must report missing YouTube config, never reach the real API.
  YOUTUBE_API_KEY: "",
  YOUTUBE_CHANNEL_ID: "",
};

// ----- Stub Supabase -----
const now = new Date().toISOString();
const tables = {
  live_status: { state: "live", video_id: "dQw4w9WgXcQ", title: "SMOKE live title", start_time: now, concurrent_viewers: 4321, checked_at: now },
  games: [{ slug: "pubg", name: "PUBG", is_vlog: false, cover_url: null, sort_order: 0, game_keywords: [{ keyword: "pubg" }] }],
  schedule_slots: [{ id: "00000000-0000-0000-0000-000000000001", day_of_week: 1, time_vn: "20:00:00", title: "SMOKE slot", game_slug: "pubg", note: null }],
  videos: [
    { video_id: "dQw4w9WgXcQ", title: "SMOKE PUBG video", published_at: now, duration_seconds: 3600, view_count: 99, thumbnail_url: null, was_live: true, playlist_ids: [], manual_game_slug: null, auto_game_slug: "pubg" },
  ],
  played_games: [{ game_slug: "pubg", status: "playing", sessions: 3, last_played: "2026-11-01" }],
  suggestions: [
    { id: "00000000-0000-0000-0000-0000000000aa", name: "SMOKE suggestion", source: "other", url: null, reason: "because", status: "played", linked_game_slug: "pubg", steam_app_id: null, steam_data: null, upvotes: 7, hidden: false, created_at: now, profiles: { display_name: "Smoke Fan", avatar_url: null } },
  ],
};
const stub = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  res.setHeader("content-type", "application/json");
  if (url.pathname.startsWith("/auth/v1/user")) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ message: "no session" }));
  }
  const m = url.pathname.match(/^\/rest\/v1\/(?:rpc\/)?(\w+)/);
  if (m) {
    const data = tables[m[1]] ?? [];
    const single = (req.headers.accept ?? "").includes("vnd.pgrst.object");
    return res.end(JSON.stringify(single && Array.isArray(data) ? data[0] : data));
  }
  res.statusCode = 404;
  res.end("{}");
});

// ----- Helpers -----
let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};
const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env, stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))));
  });
const get = (path, init) => fetch(APP + path, { redirect: "manual", ...init });
async function expectStatus(label, path, status, init) {
  const res = await get(path, init);
  if (res.status === status) ok(`${label} → ${status}`);
  else bad(`${label}: got ${res.status}, want ${status}`);
  return res;
}
async function expectBody(label, path, { has = [], lacks = [] }) {
  const body = await (await get(path)).text();
  for (const s of has) {
    if (body.includes(s)) ok(`${label} has "${s}"`);
    else bad(`${label} missing "${s}"`);
  }
  for (const s of lacks) {
    if (body.includes(s)) bad(`${label} leaks "${s}"`);
    else ok(`${label} has no "${s}"`);
  }
}

await new Promise((r) => stub.listen(STUB_PORT, "127.0.0.1", r));
let app;
try {
  if (!process.argv.includes("--no-build")) await run("npx", ["next", "build"]);
  app = spawn("npx", ["next", "start", "-p", String(APP_PORT)], { env, stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try {
      await get("/robots.txt");
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log("Pages");
  for (const path of ["/", "/lich", "/video", "/vlog", "/da-choi", "/de-xuat", "/gioi-thieu", "/robots.txt", "/sitemap.xml"]) {
    await expectStatus(path, path, 200);
  }
  await expectBody("/", "/", { has: ["SMOKE live title", "SMOKE PUBG video", "Đăng nhập Google", "không liên kết chính thức", "Đếm ngược", "Chạm để mở", "Trang không nhận tiền"] });
  await expectBody("/lich", "/lich", { has: ["SMOKE slot"] });
  await expectBody("/de-xuat", "/de-xuat", { has: ["SMOKE suggestion", "để gửi đề xuất"] });

  console.log("Admin (anonymous)");
  // Markers rendered only by admin pages; none may reach an anonymous visitor.
  const adminMarkers = ["Quota YouTube", "Thêm khung giờ", "Video chưa phân loại", "Playlist chính chủ", "ẩn (spam)", "— thêm game —"];
  for (const path of ["/admin", "/admin/lich", "/admin/video", "/admin/game", "/admin/de-xuat", "/admin/da-choi"]) {
    await expectBody(path, path, { has: ["could not be found"], lacks: adminMarkers });
  }

  console.log("Machine routes");
  await expectStatus("cron without secret", "/api/cron/poll-live", 401, { method: "POST" });
  await expectStatus("cron with wrong secret", "/api/cron/sync-videos", 401, { method: "POST", headers: { Authorization: "Bearer nope" } });
  await expectStatus("cron with secret, YouTube not configured", "/api/cron/poll-live", 503, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });
  await expectStatus("steam invalid appId", "/api/steam/abc", 400);
  const cb = await get("/auth/callback?next=//evil.example");
  const loc = cb.headers.get("location") ?? "";
  if (new URL(loc, APP).host === new URL(APP).host || loc.startsWith("http://localhost")) ok(`auth callback stays on-site (${loc})`);
  else bad(`auth callback redirected off-site: ${loc}`);
  await expectStatus("steam preview needs sign-in", "/api/steam/570", 401);
} catch (e) {
  bad(e.message);
} finally {
  app?.kill();
  stub.close();
}
console.log(failures ? `\nSMOKE=fail (${failures})` : "\nSMOKE=pass");
process.exit(failures ? 1 : 0);
