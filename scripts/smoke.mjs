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
  attendance_count: 1240,
  live_status: { state: "live", video_id: "dQw4w9WgXcQ", title: "SMOKE live title", start_time: now, concurrent_viewers: 4321, checked_at: now },
  games: [{ slug: "pubg", name: "PUBG", is_vlog: false, cover_url: null, sort_order: 0, game_keywords: [{ keyword: "pubg" }] }],
  schedule_slots: [{ id: "00000000-0000-0000-0000-000000000001", day_of_week: 1, time_vn: "20:00:00", title: "SMOKE slot", game_slug: "pubg", note: null }],
  videos: [
    {
      video_id: "dQw4w9WgXcQ",
      title: "SMOKE PUBG video",
      published_at: now,
      duration_seconds: 3600,
      view_count: 99,
      thumbnail_url: null,
      was_live: true,
      playlist_ids: [],
      manual_game_slug: null,
      auto_game_slug: "pubg",
      is_short: false,
      chapters: [
        { t: 0, title: "SMOKE mở đầu" },
        { t: 60, title: "SMOKE phần 1" },
        { t: 120, title: "SMOKE phần 2" },
      ],
    },
    {
      video_id: "smokeShort01",
      title: "SMOKE short",
      published_at: now,
      duration_seconds: 45,
      view_count: 5,
      thumbnail_url: null,
      was_live: false,
      playlist_ids: [],
      manual_game_slug: null,
      auto_game_slug: null,
      chapters: null,
      is_short: true,
    },
  ],
  fan_songs: [
    {
      id: "00000000-0000-0000-0000-0000000000bb",
      title: "SMOKE song",
      artist: "Smoke Fan",
      url: "https://soundcloud.com/smoke/song",
      note: null,
      thumbnail_url: null,
      approved: true,
      created_at: now,
    },
  ],
  fan_art: [
    {
      id: "00000000-0000-0000-0000-0000000000cc",
      title: "SMOKE fan art",
      artist: "Smoke Artist",
      drive_url: "https://drive.google.com/file/d/1SmokeFanArtDriveFileId000001/view",
      drive_file_id: "1SmokeFanArtDriveFileId000001",
      note: "Tranh vẽ thử nghiệm",
      approved: true,
      created_at: now,
    },
  ],
  quiz_links: [
    {
      id: "00000000-0000-0000-0000-0000000000dd",
      author_id: "00000000-0000-0000-0000-0000000000ee",
      title: "SMOKE quiz link của Bộ Tộc",
      url: "https://wordwall.net/vi/resource/123/smoke",
      description: "Quiz thử nghiệm",
      played_video_id: null,
      played_at_seconds: null,
      approved: true,
      created_at: now,
      profiles: { display_name: "Smoke Fan" },
    },
  ],
  played_games: [{ game_slug: "pubg", status: "playing", sessions: 3, last_played: "2026-11-01" }],
  suggestions: [
    {
      id: "00000000-0000-0000-0000-0000000000aa",
      name: "SMOKE suggestion",
      source: "other",
      url: null,
      reason: "because",
      status: "played",
      linked_game_slug: "pubg",
      steam_app_id: null,
      steam_data: null,
      thumbnail_path: null,
      upvotes: 7,
      hidden: false,
      created_at: now,
      profiles: { display_name: "Smoke Fan", avatar_url: null },
    },
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
  const want = [status].flat();
  if (want.includes(res.status)) ok(`${label} → ${res.status}`);
  else bad(`${label}: got ${res.status}, want ${want.join("/")}`);
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
  for (const path of [
    "/",
    "/lich",
    "/video",
    "/vlog",
    "/series",
    "/nhac",
    "/bo-toc",
    "/an-xa",
    "/gui-anh-do",
    "/da-choi",
    "/de-xuat",
    "/gioi-thieu",
    "/robots.txt",
    "/sitemap.xml",
    "/tai-khoan",
    "/kho-quote",
    "/giai-dau",
    "/offline",
  ]) {
    await expectStatus(path, path, 200);
  }
  await expectBody("/", "/", {
    has: ["SMOKE live title", "SMOKE PUBG video", "Vào Bộ Tộc", "không liên kết chính thức", "Đếm ngược", "Chạm để mở", "Trang không nhận tiền"],
  });
  await expectBody("/lich", "/lich", { has: ["SMOKE slot", "Tối nay tôi có mặt", "người Bộ Tộc đã hẹn"] });
  await expectStatus("stats page was removed (YouTube Studio has it)", "/thong-ke", 404);
  await expectBody("/bo-toc wall", "/bo-toc", { has: ["Bức tường Bộ Tộc"] });
  await expectBody("/video timeline + shorts", "/video", { has: ["Timeline buổi stream gần nhất", "SMOKE mở đầu", "Shorts mới"] });
  await expectBody("/ shorts", "/", { has: ["Shorts mới"] });
  await expectBody("/kho-quote", "/kho-quote", { has: ["Kho quote", "Chưa có quote nào trong kho"] });
  await expectBody("/giai-dau", "/giai-dau", { has: ["Giải đấu"] });
  await expectBody("/offline", "/offline", { has: ["Bạn đang offline"] });
  await expectBody("/bo-toc glossary", "/bo-toc", { has: ["Từ điển Bộ Tộc", "Góp từ cho từ điển"] });
  await expectBody("/de-xuat", "/de-xuat", { has: ["SMOKE suggestion", "để gửi đề xuất"] });
  await expectBody("/bo-toc", "/bo-toc", {
    has: [
      "Từ điển Bộ Tộc",
      "Tộc Trưởng",
      "facebook.com/groups/mixigaming",
      "Hồ sơ Dự Án Ma",
      "Bộ Tộc vẫn hóng",
      "Đơn hối lỗi xin về bờ",
      "Góp Gạch Xây Trường",
      "Trang không nhận quyên góp",
      "Lươn Cao Bằng",
      "Quiz Bộ Tộc làm cho anh Độ",
      "SMOKE quiz link",
      "Phòng tranh Fan Art",
      "SMOKE fan art",
    ],
  });
  await expectBody("/an-xa", "/an-xa", { has: ["TÒA ÁN ÂN XÁ", "Máy tạo Đơn hối lỗi xin về bờ", "Khai báo hồ sơ"] });
  await expectBody("/gui-anh-do", "/gui-anh-do", { has: ["GỬI ANH ĐỘ MIXI", "Top Game Bộ Tộc đề xuất", "SMOKE song", "SMOKE fan art"] });
  await expectBody("/lich", "/lich", { has: ["Radar sự kiện Bộ Tộc", "Sinh nhật Tộc Trưởng"] });
  await expectBody("/nhac", "/nhac", { has: ["Nhạc nịnh Bộ Tộc", "SMOKE song", "Nghe trực tiếp", "Bấm “Vào Bộ Tộc” (góc trên bên phải) để gửi link"] });

  console.log("Admin (anonymous)");
  // Markers rendered only by admin pages; none may reach an anonymous visitor.
  const adminMarkers = [
    "Quota YouTube",
    "Thêm khung giờ",
    "Video chưa phân loại",
    "Playlist chính chủ",
    "ẩn (spam)",
    "— thêm game —",
    "Nhạc nịnh – duyệt bài",
    "Tranh Fan Art (Google Drive) – duyệt bài",
    "Đố vui Bộ Tộc – duyệt câu hỏi",
    "Cấm ngầm",
    "Quản trị viên & tài khoản chính chủ",
    "Bức tường Bộ Tộc – duyệt lời nhắn",
    "Kho quote – duyệt quote",
    "Từ điển – duyệt từ fan góp",
    "Giải đấu – quản lý",
    "Skin theo dịp – lịch bật",
    "Hộp duyệt – mọi nội dung fan gửi đang chờ",
    "Nhật ký kiểm duyệt",
    "Tìm theo tên hiển thị",
    "Thêm từ khóa chặn",
  ];
  for (const path of [
    "/admin",
    "/admin/lich",
    "/admin/video",
    "/admin/game",
    "/admin/de-xuat",
    "/admin/da-choi",
    "/admin/nhac",
    "/admin/fan-art",
    "/admin/quiz",
    "/admin/quan-tri",
    "/admin/tuong",
    "/admin/quote",
    "/admin/tu-dien",
    "/admin/giai-dau",
    "/admin/skin",
    "/admin/duyet",
    "/admin/nhat-ky",
    "/admin/nguoi-dung",
    "/admin/tu-khoa",
  ]) {
    await expectBody(path, path, { has: ["Không tìm thấy trang này"], lacks: adminMarkers });
  }

  console.log("Machine routes");
  await expectStatus("cron without secret", "/api/cron/poll-live", 401, { method: "POST" });
  await expectStatus("moderation alert cron without secret", "/api/cron/moderation-alert", 401, { method: "POST" });
  await expectStatus("websub renew cron without secret", "/api/cron/websub-renew", 401, { method: "POST" });
  await expectStatus("websub callback with no challenge", "/api/webhooks/youtube", [404, 503]);
  await expectStatus("websub callback unsigned POST is not processed", "/api/webhooks/youtube", [202, 503], { method: "POST", body: "<feed/>" });
  await expectStatus("cron with wrong secret", "/api/cron/sync-videos", 401, { method: "POST", headers: { Authorization: "Bearer nope" } });
  await expectStatus("cron with secret, YouTube not configured", "/api/cron/poll-live", 503, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });
  await expectStatus("steam invalid appId", "/api/steam/abc", 400);
  // Accounts are tên Bộ Tộc + mã khóa (ADR-013): no OAuth callback exists any more.
  await expectStatus("no Google OAuth callback", "/auth/callback?code=x", 404);
  const badInvite = await get("/moi/not-a-real-token");
  const inviteHtml = await badInvite.text();
  if (badInvite.status === 200 && inviteHtml.includes("Link mời không dùng được")) ok("a bad invite link is refused");
  else bad(`bad invite link: ${badInvite.status}`);
  if (!/noindex/.test(inviteHtml)) bad("invite page must be noindex");
  if (badInvite.headers.get("referrer-policy") === "no-referrer") ok("invite page sends no Referer");
  else bad(`invite page Referrer-Policy: ${badInvite.headers.get("referrer-policy")}`);
  await expectStatus("steam preview needs sign-in", "/api/steam/570", 401);
} catch (e) {
  bad(e.message);
} finally {
  app?.kill();
  stub.close();
}
console.log(failures ? `\nSMOKE=fail (${failures})` : "\nSMOKE=pass");
process.exit(failures ? 1 : 0);
