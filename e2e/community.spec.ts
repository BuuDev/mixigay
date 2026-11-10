import type { Browser, BrowserContextOptions, Page } from "@playwright/test";
import { dismissIntro, expect, hasSupabase, signUpThroughDialog, test } from "./fixtures";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createAdminClient, E2E_PREFIX, uniqueTag, userIdForHandle } from "./supabase";

// Real accounts against the DEV Supabase project (needs a build made with the dev env).
// Every account is named "e2e…" and removed by the global teardown.
test.describe.configure({ mode: "serial" });

const tag = uniqueTag();
const adminHandle = `${E2E_PREFIX}admin${tag}`;
const adminPassphrase = `e2e-quan-tri-ma-khoa-rat-dai-${tag}`;
let adminState: BrowserContextOptions["storageState"];

/** New context with the radio off (same as the fixture) and optionally a saved session. */
async function newPage(browser: Browser, opts: BrowserContextOptions = {}): Promise<Page> {
  const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: { width: 1366, height: 900 }, ...opts });
  await ctx.addInitScript(() => localStorage.setItem("gbt:bgm", "off"));
  return ctx.newPage();
}

test("an admin invite is redeemed in the browser", async ({ page, supabaseAdmin }) => {
  const { data: token, error } = await supabaseAdmin.rpc("issue_invite", { p_role: "admin", p_handle: adminHandle, p_display: `E2E Quản trị ${tag}` });
  expect(error?.message).toBeUndefined();
  expect(String(token)).toMatch(/^[0-9a-f]{64}$/);

  await page.goto(`/moi/${token}`);
  const form = page.locator("main form");
  await form.locator("input[name=passphrase]").fill(adminPassphrase);
  await form.locator("input[name=confirm]").fill(adminPassphrase);
  await page.getByRole("button", { name: "Nhận lời mời" }).click();
  await page.waitForURL(/\/admin/, { timeout: 20_000 });
  await expect(page.getByRole("banner").getByRole("link", { name: "Quản trị", exact: true })).toBeVisible();
  adminState = await page.context().storageState();
});

test("a wrong passphrase gets the generic error", async ({ page }) => {
  await page.goto("/gioi-thieu");
  await page.getByRole("banner").getByRole("button", { name: "Vào Bộ Tộc", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator("input[name=handle]").fill(adminHandle);
  await dialog.locator("input[name=passphrase]").fill(`sai-ma-khoa-hoan-toan-${tag}`);
  await dialog.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Sai tên hoặc mã khóa.");
  // The controlled field keeps the name after a failed attempt.
  await expect(dialog.locator("input[name=handle]")).toHaveValue(adminHandle);
});

for (const width of [1024, 1366]) {
  test(`admin header: nav and account area do not overlap at ${width}px`, async ({ browser }) => {
    expect(adminState, "admin session from the invite test").toBeDefined();
    const page = await newPage(browser, { viewport: { width, height: 900 }, storageState: adminState });
    await page.goto("/lich");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "Quản trị", exact: true })).toBeVisible();
    const box = await banner.evaluate((header) => {
      const nav = header.querySelector("nav")!;
      const visible = [...nav.children].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
      const account = header.querySelector("nav + div")!;
      const parts = [...account.querySelectorAll("a, button")].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0);
      return {
        navRight: Math.max(...visible.map((r) => r.right)),
        accountLeft: Math.min(...parts.map((r) => r.left)),
        scrollX: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(box.navRight).toBeLessThan(box.accountLeft);
    expect(box.scrollX).toBeLessThanOrEqual(0);
    await page.context().close();
  });
}

test("fan suggests a game → pending for the author only → approved → another fan upvotes", async ({ page, browser, supabaseAdmin }) => {
  expect(adminState, "admin session from the invite test").toBeDefined();
  const gameName = `E2E Game ${tag}`;

  // 1. Fan 1 signs up through the dialog and submits a suggestion.
  await page.goto("/de-xuat");
  await signUpThroughDialog(page, `${E2E_PREFIX}fan${tag}`, `E2E Fan ${tag}`);
  const form = page.locator("form", { has: page.getByRole("heading", { name: "Đề xuất game cho anh Độ" }) });
  await form.getByLabel("Nguồn").selectOption({ label: "Khác" });
  await form.getByLabel("Tên game").fill(gameName);
  await form.getByLabel("Lý do ngắn").fill(`Đề xuất thử nghiệm tự động ${tag}, xin bỏ qua.`);
  await form.getByRole("button", { name: "Gửi đề xuất" }).click();
  const pendingCard = page.locator("div", { has: page.getByRole("heading", { name: "Đề xuất của bạn đang chờ duyệt" }) }).last();
  await expect(pendingCard).toContainText(gameName, { timeout: 20_000 });

  // 2. Invisible to an anonymous visitor.
  const anon = await newPage(browser);
  await anon.goto("/de-xuat");
  await expect(anon.getByRole("heading", { name: "Danh sách đề xuất" })).toBeAttached();
  await expect(anon.getByText(gameName)).toHaveCount(0);

  // 3. Approved. Through the admin screen rather than a bare service-role UPDATE: the public
  //    list is cached ("use cache", tag "suggestions") and only the admin action calls updateTag.
  const { data: row } = await supabaseAdmin.from("suggestions").select("id, approved").eq("name", gameName).single();
  expect(row?.approved).toBe(false);
  const admin = await newPage(browser, { storageState: adminState });
  await admin.goto("/admin/de-xuat");
  const item = admin.locator("li", { hasText: gameName });
  await item.getByRole("checkbox", { name: "duyệt" }).check();
  await item.getByRole("button", { name: "Lưu" }).click();
  await expect
    .poll(async () => (await supabaseAdmin.from("suggestions").select("approved").eq("id", row!.id).single()).data?.approved, { timeout: 15_000 })
    .toBe(true);

  // 4. Fan 2 (accounts younger than 24 h cannot vote: age the profile) upvotes it.
  const fan2 = await newPage(browser);
  await fan2.goto("/de-xuat");
  const fan2Handle = `${E2E_PREFIX}fanb${tag}`;
  await signUpThroughDialog(fan2, fan2Handle, `E2E Fan B ${tag}`);
  const fan2Id = await userIdForHandle(supabaseAdmin, fan2Handle);
  const aged = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  expect((await supabaseAdmin.from("profiles").update({ created_at: aged }).eq("id", fan2Id)).error).toBeNull();

  await fan2.reload();
  const vote = fan2.getByRole("button", { name: new RegExp(`^Upvote ${gameName}:`) });
  await expect(vote).toHaveAttribute("aria-pressed", "false", { timeout: 15_000 });
  await expect(vote).toContainText("0");
  await vote.click();
  await expect(vote).toHaveAttribute("aria-pressed", "true");
  await expect(vote).toContainText("1");
  await expect
    .poll(async () => (await supabaseAdmin.from("suggestions").select("upvotes").eq("id", row!.id).single()).data?.upvotes, { timeout: 15_000 })
    .toBe(1);
  await expect(fan2.getByRole("status").filter({ hasText: /lỗi|không|chưa/i })).toHaveCount(0);

  // 5. Persists after reload. Votes revalidate the list stale-while-revalidate, so the
  //    first reload may still serve the old count: reload until the fresh one arrives.
  await expect(async () => {
    await fan2.reload();
    const v = fan2.getByRole("button", { name: new RegExp(`^Upvote ${gameName}:`) });
    await expect(v).toHaveAttribute("aria-pressed", "true", { timeout: 5000 });
    await expect(v).toContainText("1", { timeout: 1000 });
  }).toPass({ timeout: 30_000 });

  for (const p of [anon, admin, fan2]) await p.context().close();
});

// Cleanup state for the game-art test (Storage objects and banned hashes outlive accounts).
const artCleanup = { paths: [] as string[], hashes: [] as string[] };

test("fan uploads a game thumbnail → sanitised into Storage → shown after approval → removed and banned", async ({ page, browser, supabaseAdmin }) => {
  expect(adminState, "admin session from the invite test").toBeDefined();
  const gameName = `E2E Art ${tag}`;
  // A unique PNG per run (random noise) so the ban list of earlier runs never matches.
  const raw = Buffer.from(Array.from({ length: 64 * 36 * 3 }, () => Math.floor(Math.random() * 256)));
  const png = await sharp(raw, { raw: { width: 64, height: 36, channels: 3 } })
    .png()
    .toBuffer();

  // 1. Submit a non-Steam suggestion with a thumbnail.
  await page.goto("/de-xuat");
  await signUpThroughDialog(page, `${E2E_PREFIX}artfan${tag}`, `E2E Art Fan ${tag}`);
  const form = page.locator("form", { has: page.getByRole("heading", { name: "Đề xuất game cho anh Độ" }) });
  await form.getByLabel("Nguồn").selectOption({ label: "Khác" });
  await form.getByLabel("Tên game").fill(gameName);
  await form.getByLabel("Lý do ngắn").fill(`Thử ảnh thumbnail tự động ${tag}, xin bỏ qua.`);
  await form.locator("input[name=thumbnail]").setInputFiles({ name: "thumb.png", mimeType: "image/png", buffer: png });
  await expect(form.getByAltText("Xem trước ảnh thumbnail")).toBeVisible();
  await form.getByRole("button", { name: "Gửi đề xuất" }).click();
  await expect(page.locator("div", { has: page.getByRole("heading", { name: "Đề xuất của bạn đang chờ duyệt" }) }).last()).toContainText(gameName, {
    timeout: 20_000,
  });

  // 2. Stored as a sanitised WebP; the verdict sits in the admin-only review table.
  const { data: row } = await supabaseAdmin.from("suggestions").select("id, thumbnail_path, approved").eq("name", gameName).single();
  expect(row?.approved).toBe(false);
  expect(row?.thumbnail_path).toMatch(/^suggestions\/[0-9a-f-]{36}\.webp$/);
  artCleanup.paths.push(row!.thumbnail_path!);
  const { data: file } = await supabaseAdmin.storage.from("game-art").download(row!.thumbnail_path!);
  const meta = await sharp(Buffer.from(await file!.arrayBuffer())).metadata();
  expect({ format: meta.format, width: meta.width, height: meta.height, exif: meta.exif }).toEqual({
    format: "webp",
    width: 640,
    height: 360,
    exif: undefined,
  });
  const { data: review } = await supabaseAdmin.from("suggestion_art_reviews").select("review").eq("suggestion_id", row!.id).single();
  const r = review?.review as { verdict: string; sha256: string; originalSha256: string };
  expect(["review", "ok"]).toContain(r.verdict);
  artCleanup.hashes.push(r.sha256, r.originalSha256);

  // 3. Admin approves; the public card shows our own Storage image.
  const admin = await newPage(browser, { storageState: adminState });
  await admin.goto("/admin/de-xuat");
  const item = admin.locator("li", { hasText: gameName });
  await expect(item.locator(`img[src*="${row!.thumbnail_path}"]`)).toBeVisible();
  await item.getByRole("checkbox", { name: "duyệt" }).check();
  await item.getByRole("button", { name: "Lưu" }).click();
  await expect
    .poll(async () => (await supabaseAdmin.from("suggestions").select("approved").eq("id", row!.id).single()).data?.approved, { timeout: 15_000 })
    .toBe(true);
  const anon = await newPage(browser);
  await expect(async () => {
    await anon.goto("/de-xuat");
    const img = anon
      .locator("div", { has: anon.getByText(gameName, { exact: true }) })
      .locator(`img[src*="${encodeURIComponent(row!.thumbnail_path!)}"]`)
      .first();
    await expect(img).toBeVisible({ timeout: 5000 });
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }).toPass({ timeout: 30_000 });

  // 4. "Gỡ ảnh + chặn vĩnh viễn": the image is gone and both hashes are banned.
  await admin.reload();
  await admin.locator("li", { hasText: gameName }).getByRole("button", { name: "Gỡ ảnh + chặn vĩnh viễn" }).click();
  await expect
    .poll(async () => (await supabaseAdmin.from("suggestions").select("thumbnail_path").eq("id", row!.id).single()).data?.thumbnail_path, { timeout: 15_000 })
    .toBeNull();
  const { count } = await supabaseAdmin.from("banned_image_hashes").select("sha256", { count: "exact", head: true }).in("sha256", artCleanup.hashes);
  expect(count).toBe(new Set(artCleanup.hashes).size);

  // 5. Uploading the same picture again is refused with the generic message, and nothing is saved.
  const again = `${gameName} lần 2`;
  await page.goto("/de-xuat");
  await form.getByLabel("Nguồn").selectOption({ label: "Khác" });
  await form.getByLabel("Tên game").fill(again);
  await form.getByLabel("Lý do ngắn").fill(`Thử tải lại ảnh đã bị chặn ${tag}.`);
  await form.locator("input[name=thumbnail]").setInputFiles({ name: "thumb.png", mimeType: "image/png", buffer: png });
  await form.getByRole("button", { name: "Gửi đề xuất" }).click();
  await expect(page.getByText("Ảnh này không phù hợp với Góc Bộ Tộc, chọn ảnh khác nhé.")).toBeVisible({ timeout: 20_000 });
  expect((await supabaseAdmin.from("suggestions").select("id").eq("name", again)).data).toEqual([]);

  for (const p of [anon, admin]) await p.context().close();
});

test("moderation center: reject with a reason, approve, the author sees why, admin blocked terms stop a post", async ({ page, browser, supabaseAdmin }) => {
  expect(adminState, "admin session from the invite test").toBeDefined();
  // A fan created with the service role (the sign-up form allows 3 accounts per IP per hour,
  // and earlier tests in this file already use them), aged so no new-account limits apply.
  const handle = `${E2E_PREFIX}mod${tag}`;
  const passphrase = `e2e-kiem-duyet-ma-khoa-${tag}`;
  const email = `u-${randomUUID()}@id.gocbotoc.invalid`;
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: passphrase,
    email_confirm: true,
    user_metadata: { full_name: `E2E Mod Fan ${tag}` },
  });
  expect(createErr).toBeNull();
  const fanId = created.user!.id;
  const { data: key } = await supabaseAdmin.rpc("name_key", { t: handle });
  expect((await supabaseAdmin.from("account_logins").insert({ handle_key: key, user_id: fanId, auth_email: email })).error).toBeNull();
  await supabaseAdmin
    .from("profiles")
    .update({ created_at: new Date(Date.now() - 3 * 864e5).toISOString() })
    .eq("id", fanId);
  const rejectBody = `E2E lời nhắn sẽ bị từ chối ${tag}`;
  const approveBody = `E2E lời nhắn sẽ được duyệt ${tag}`;
  const { data: rows, error: insErr } = await supabaseAdmin
    .from("wall_messages")
    .insert([
      { author_id: fanId, body: rejectBody },
      { author_id: fanId, body: approveBody },
    ])
    .select("id, body");
  expect(insErr).toBeNull();
  const idOf = (b: string) => rows!.find((r) => r.body === b)!.id as string;

  // 1. Both wait in the shared inbox, filtered to wall messages.
  const admin = await newPage(browser, { storageState: adminState });
  await admin.goto("/admin/duyet?kind=wall_message");
  const card = (b: string) => admin.locator("li", { hasText: b });
  await expect(card(rejectBody)).toBeVisible();
  await expect(card(approveBody)).toBeVisible();

  // 2. Reject one with a preset + note.
  await card(rejectBody).getByText("Từ chối…").click();
  await card(rejectBody).getByLabel("Lý do từ chối").selectOption("Spam / quảng cáo");
  await card(rejectBody).getByLabel("Ghi thêm lý do").fill("thử nghiệm tự động");
  await card(rejectBody).getByRole("button", { name: "Từ chối", exact: true }).click();
  await expect
    .poll(async () => (await supabaseAdmin.from("wall_messages").select("approved, rejected_at, rejected_reason").eq("id", idOf(rejectBody)).single()).data, {
      timeout: 15_000,
    })
    .toMatchObject({ approved: false, rejected_reason: "Spam / quảng cáo: thử nghiệm tự động" });
  // Kept, not deleted (deleting would refund the spammer's daily quota).
  expect((await supabaseAdmin.from("wall_messages").select("id").eq("id", idOf(rejectBody))).data).toHaveLength(1);

  // 3. Approve the other; it goes public and leaves the inbox.
  await admin.reload();
  await card(approveBody).getByRole("button", { name: "Duyệt", exact: true }).click();
  await expect
    .poll(async () => (await supabaseAdmin.from("wall_messages").select("approved").eq("id", idOf(approveBody)).single()).data?.approved, { timeout: 15_000 })
    .toBe(true);
  await admin.reload();
  await expect(card(approveBody)).toHaveCount(0);
  await expect(card(rejectBody)).toHaveCount(0);

  // 4. The audit log has both decisions, with the actor and the reason.
  const { data: log } = await supabaseAdmin
    .from("moderation_log")
    .select("action, reason, actor_id, target_id")
    .in("target_id", [idOf(rejectBody), idOf(approveBody)]);
  expect(log?.map((l) => l.action).sort()).toEqual(["approve", "reject"]);
  expect(log?.find((l) => l.action === "reject")?.reason).toBe("Spam / quảng cáo: thử nghiệm tự động");
  expect(log?.every((l) => l.actor_id)).toBe(true);
  await admin.goto("/admin/nhat-ky?kind=wall_message");
  await expect(admin.getByText("Spam / quảng cáo: thử nghiệm tự động").first()).toBeVisible();

  // 5. The author signs in and sees the status and the reason on /tai-khoan (not who decided).
  // Signed out, /tai-khoan redirects home (intro overlay): sign in from a plain page instead.
  await page.goto("/gioi-thieu");
  await page.getByRole("button", { name: "Vào Bộ Tộc" }).first().click();
  await page.locator("dialog input[name=handle]").fill(handle);
  await page.locator("dialog input[name=passphrase]").fill(passphrase);
  await page.getByRole("button", { name: "Đăng nhập" }).last().click();
  await expect(page.getByRole("link", { name: new RegExp(`E2E Mod Fan ${tag}`) })).toBeVisible({ timeout: 15_000 });
  await page.goto("/tai-khoan");
  const mine = page.locator("section, div", { has: page.getByText("Nội dung của bạn", { exact: true }) }).last();
  await expect(mine).toContainText(rejectBody.slice(0, 30));
  await expect(mine).toContainText("Lý do: Spam / quảng cáo: thử nghiệm tự động");

  // 6. An admin-added blocked term stops a post that the built-in lexicon would let through.
  const term = `kèo${tag}`;
  await admin.goto("/admin/tu-khoa");
  await admin.locator("#term").fill(term);
  await admin.locator("#category").selectOption("spam");
  await admin.getByRole("button", { name: "Thêm", exact: true }).click();
  await expect.poll(async () => (await supabaseAdmin.from("blocked_terms").select("term").eq("term", term)).data?.length, { timeout: 15_000 }).toBe(1);
  await page.goto("/bo-toc");
  const wall = page.locator("section", { has: page.getByRole("heading", { name: /Bức tường Bộ Tộc/ }) }).first();
  const blocked = `Anh em vào xem ${term} nhé`;
  await wall.locator("textarea").fill(blocked);
  await wall.locator("button[type=submit]").click();
  await expect(wall.getByText(/không phù hợp/i)).toBeVisible({ timeout: 15_000 });
  expect((await supabaseAdmin.from("wall_messages").select("id").eq("body", blocked)).data).toEqual([]);

  await supabaseAdmin.from("blocked_terms").delete().eq("term", term);
  await admin.context().close();
});

test("community corner: admin opens a poll and a fan votes on the home page", async ({ page, browser, supabaseAdmin }) => {
  expect(adminState, "admin session from the invite test").toBeDefined();
  const question = `E2E bình chọn ${tag}?`;
  const optA = `E2E lựa chọn A ${tag}`;
  const optB = `E2E lựa chọn B ${tag}`;
  try {
    // 1. Admin creates and opens the poll through /admin/binh-chon (its actions refresh the cache).
    const admin = await newPage(browser, { storageState: adminState });
    await admin.goto("/admin/binh-chon");
    const create = admin.locator("form", { has: admin.getByRole("button", { name: "Tạo nháp", exact: true }) });
    await create.locator("input[name=question]").fill(question);
    await create.locator("textarea[name=options]").fill(`${optA}\n${optB}`);
    await create.getByRole("button", { name: "Tạo nháp", exact: true }).click();
    const row = admin.locator("li", { hasText: question }).first();
    await row.getByRole("button", { name: "Mở bình chọn" }).click();
    await expect
      .poll(async () => (await supabaseAdmin.from("polls").select("status").eq("question", question).single()).data?.status, { timeout: 15_000 })
      .toBe("open");
    await admin.context().close();

    // 2. An aged fan (service role: the sign-up form is limited per IP) votes from the home page.
    const handle = `${E2E_PREFIX}poll${tag}`;
    const passphrase = `e2e-binh-chon-ma-khoa-${tag}`;
    const email = `u-${randomUUID()}@id.gocbotoc.invalid`;
    const { data: created } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: passphrase,
      email_confirm: true,
      user_metadata: { full_name: `E2E Poll Fan ${tag}` },
    });
    const fanId = created!.user!.id;
    const { data: key } = await supabaseAdmin.rpc("name_key", { t: handle });
    await supabaseAdmin.from("account_logins").insert({ handle_key: key, user_id: fanId, auth_email: email });
    await supabaseAdmin
      .from("profiles")
      .update({ created_at: new Date(Date.now() - 3 * 864e5).toISOString() })
      .eq("id", fanId);
    await page.goto("/gioi-thieu");
    await page.getByRole("button", { name: "Vào Bộ Tộc" }).first().click();
    await page.locator("dialog input[name=handle]").fill(handle);
    await page.locator("dialog input[name=passphrase]").fill(passphrase);
    await page.getByRole("button", { name: "Đăng nhập" }).last().click();
    await expect(page.getByRole("link", { name: new RegExp(`E2E Poll Fan ${tag}`) })).toBeVisible({ timeout: 15_000 });

    await page.goto("/");
    await dismissIntro(page);
    const card = page.getByRole("region", { name: "Bình chọn của Bộ Tộc" }).or(page.locator('[aria-label="Bình chọn của Bộ Tộc"]')).first();
    // The admin's updateTag expires the cached home page; the first request after it may still
    // be answered from the old copy while the new one renders (stale-while-revalidate), so a
    // reload is allowed — but the new poll must show within a few seconds, not an hour.
    await expect(async () => {
      await page.reload();
      await card.scrollIntoViewIfNeeded();
      await expect(card).toContainText(question, { timeout: 2_000 });
    }).toPass({ timeout: 20_000, intervals: [1000, 2000, 3000] });
    await card.getByRole("button", { name: new RegExp(optA) }).click();
    await expect(card.getByText("Bạn đã chọn")).toBeVisible({ timeout: 15_000 });
    // The card updates optimistically; the vote row and the trigger-kept count land a moment later.
    await expect
      .poll(
        async () => {
          const { data } = await supabaseAdmin.from("polls").select("poll_options(label, votes)").eq("question", question).single();
          return (data?.poll_options as { label: string; votes: number }[] | undefined)?.find((o) => o.label === optA)?.votes;
        },
        { timeout: 15_000 },
      )
      .toBe(1);
  } finally {
    await supabaseAdmin.from("polls").delete().eq("question", question);
  }
});

// Belt and braces when a single spec is run without the global teardown.
test.afterAll(async () => {
  if (!hasSupabase) return;
  const admin = createAdminClient();
  if (artCleanup.paths.length) await admin.storage.from("game-art").remove(artCleanup.paths);
  if (artCleanup.hashes.length) await admin.from("banned_image_hashes").delete().in("sha256", artCleanup.hashes);
  const { data } = await admin.from("account_logins").select("user_id").like("handle_key", `%${tag}`);
  for (const l of data ?? []) await admin.auth.admin.deleteUser(l.user_id as string);
  await admin.from("invites").delete().like("handle_key", `%${tag}`);
});
