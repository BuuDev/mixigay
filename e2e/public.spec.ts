import { dismissIntro, expect, test } from "./fixtures";

// Mock-safe: passes on a mock build (no Supabase env) and on a dev-project build.

test.describe("public pages", () => {
  test("/lich shows the week schedule and a non-empty live status card", async ({ page }) => {
    await page.goto("/lich");
    await expect(page.getByRole("heading", { level: 1, name: "Lịch stream tuần này" })).toBeVisible();
    await expect(page.getByText("Giờ gốc theo giờ Việt Nam (UTC+7)")).toBeVisible();
    await expect(page.getByText(/^(Chủ nhật|Thứ [2-7])/).first()).toBeVisible();
    // Regression: the card once stayed on its blank hydration placeholder.
    const card = page.locator("main [aria-live=polite]").first();
    await expect(card).toBeVisible();
    await expect(card).not.toHaveText(/^\s*$/);
    await expect.poll(async () => (await card.innerText()).trim().length).toBeGreaterThan(10);
  });

  test("/video game chips filter the grid and show the game banner", async ({ page }) => {
    await page.goto("/video");
    const filters = page.getByRole("navigation", { name: "Lọc video theo game" });
    const grid = page.locator("h2:text-is('Danh sách video') + div li");
    const all = filters.getByRole("link", { name: /^Tất cả \d+$/ });
    await expect(all).toHaveAttribute("aria-current", "page");
    const total = Number((await all.innerText()).match(/\d+/)?.[0]);
    // Only one page of cards is sent (48), never the whole channel.
    await expect(grid).toHaveCount(Math.min(total, 48));

    const chips = filters.getByRole("link");
    const labels = await chips.allInnerTexts();
    const index = labels.findIndex((l, i) => i > 0 && !l.startsWith("Chưa phân loại") && /\d+\s*$/.test(l) && Number(l.match(/(\d+)\s*$/)?.[1]) < total);
    expect(index, `a game chip in ${JSON.stringify(labels)}`).toBeGreaterThan(0);
    const chip = chips.nth(index);
    const [, name, count] = labels[index].match(/^(.*?)\s+(\d+)\s*$/) ?? [];

    await chip.click();
    await expect(page).toHaveURL(/[?&]game=/);
    await expect(filters.getByRole("link", { name: labels[index] })).toHaveAttribute("aria-current", "page");
    await expect(all).not.toHaveAttribute("aria-current", "page");
    await expect(grid).toHaveCount(Math.min(Number(count), 48));
    const banner = page.locator("div.relative", { has: page.getByText(`${count} video`, { exact: true }) }).last();
    await expect(banner).toBeVisible();
    await expect(banner.getByText(name, { exact: true })).toBeVisible();
  });

  test("/video 'Xem thêm' loads the next page through the URL", async ({ page }) => {
    await page.goto("/video");
    const status = await page.getByText(/^Đang xem \d+ \/ \d+ video$/).innerText();
    const [shown, total] = (status.match(/\d+/g) ?? []).map(Number);
    const more = page.getByRole("link", { name: /^Xem thêm \d+ video$/ });
    if (total <= 48) {
      // Mock data: everything fits on one page.
      expect(shown).toBe(total);
      await expect(more).toHaveCount(0);
      return;
    }
    expect(shown).toBe(48);
    await more.click();
    await expect(page).toHaveURL(/[?&]n=96/);
    await expect(page.locator("h2:text-is('Danh sách video') + div li")).toHaveCount(Math.min(96, total));
  });

  test("header 'Thêm' opens a two-column menu anchored under the button @desktop", async ({ page }) => {
    await page.goto("/lich");
    const button = page.getByRole("banner").getByRole("button", { name: "Thêm ▾" });
    await button.click();
    const menu = page.locator("#header-more");
    await expect(menu).toBeVisible();
    const b = (await button.boundingBox())!;
    const m = (await menu.boundingBox())!;
    const vw = page.viewportSize()!.width;
    expect(m.x).toBeGreaterThanOrEqual(0);
    expect(m.x + m.width).toBeLessThanOrEqual(vw);
    expect(Math.abs(m.x - b.x)).toBeLessThanOrEqual(48);
    expect(m.y).toBeGreaterThanOrEqual(b.y + b.height);
    expect(m.y - (b.y + b.height)).toBeLessThanOrEqual(24);
    // Two columns side by side.
    const columns = menu.locator(":scope > div > div");
    await expect(columns).toHaveCount(2);
    const [c1, c2] = [(await columns.nth(0).boundingBox())!, (await columns.nth(1).boundingBox())!];
    expect(c2.x).toBeGreaterThan(c1.x + c1.width - 1);
    expect(Math.abs(c2.y - c1.y)).toBeLessThan(4);
  });

  test("phone shows the bottom tab bar @phone", async ({ page }) => {
    await page.goto("/lich");
    const tabs = page.locator("nav.td-bottom-nav");
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Đề xuất" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("button", { name: "Thêm ▾" })).toBeHidden();
  });

  test("home puts the community corner right after the cover, with shortcuts in the hero", async ({ page }) => {
    await page.goto("/");
    await dismissIntro(page);
    const shortcuts = page.getByRole("navigation", { name: "Góc tương tác" });
    // Thả cảm xúc · Bình chọn · Điểm danh → #tuong-tac, Góp sức → #gop-suc.
    await expect(shortcuts.getByRole("link")).toHaveCount(4);
    await expect(shortcuts.getByRole("link", { name: /Góp sức/ })).toHaveAttribute("href", "#gop-suc");
    await expect(shortcuts.getByRole("link").first()).toHaveAttribute("href", "#tuong-tac");
    // The first section after the cover is the community corner.
    const order = await page.evaluate(() =>
      [...document.querySelectorAll("main section")].filter((el) => el.parentElement?.closest("section") === null).map((el) => el.id),
    );
    expect(order.indexOf("tuong-tac")).toBe(1);
    await shortcuts.getByRole("link").first().click();
    await expect(page.getByRole("group", { name: "Thả cảm xúc" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("group", { name: "Thả cảm xúc" }).getByRole("button")).toHaveCount(4);
  });

  test("/thong-ke is gone (404)", async ({ page }) => {
    const res = await page.goto("/thong-ke");
    expect(res?.status()).toBe(404);
  });

  for (const path of ["/", "/lich", "/video", "/bo-toc", "/nhac", "/de-xuat"]) {
    test(`no page or console errors on ${path}`, async ({ page, errors }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      if (path === "/") await dismissIntro(page);
      // Give hydration and post-hydration effects a moment to report.
      await page.waitForTimeout(1000);
      expect(errors).toEqual([]);
    });
  }
});
