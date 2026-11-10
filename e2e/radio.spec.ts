import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// The background radio ("Đài phát thanh Bộ Tộc", src/features/music/components/bg-music-player.tsx).
// Mock-safe, desktop only. This spec turns the radio-off init script off.
test.use({ radio: "on" });

const audioState = (page: Page) =>
  page.evaluate(() => {
    const els = [...document.querySelectorAll("audio")];
    const playing = els.find((a) => !a.paused);
    return {
      count: els.length,
      anyPlaying: Boolean(playing),
      currentTime: playing?.currentTime ?? 0,
      volume: playing?.volume ?? null,
      src: playing?.currentSrc ?? "",
    };
  });

/** A click on blank page margin (outside the 72rem content column): a real gesture on nothing interactive. */
async function clickEmptyArea(page: Page) {
  const { width } = page.viewportSize()!;
  await page.mouse.click(width - 12, 400);
}

async function expectSilentFor(page: Page, ms: number) {
  await page.waitForTimeout(ms);
  expect((await audioState(page)).anyPlaying).toBe(false);
}

// The player tries to play on load. Headless Chromium sometimes allows that and sometimes
// rejects it with NotAllowedError (seen both ways across runs of the full suite), so this
// spec accepts either path: playing on open, or at the latest on the first click.
test("plays Airport Lounge at volume 0.3 on open or on the first click; 'Tắt hẳn nhạc' sticks", async ({ page }) => {
  await page.goto("/lich");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect((await audioState(page)).count).toBeGreaterThan(0);
  await page.waitForTimeout(2000);
  if (!(await audioState(page)).anyPlaying) await clickEmptyArea(page);
  await expect.poll(async () => (await audioState(page)).anyPlaying, { timeout: 15_000 }).toBe(true);
  const first = await audioState(page);
  expect(first.volume).toBeCloseTo(0.3, 2);
  expect(first.src).toMatch(/\/music\/airport-lounge\.m4a$/);
  await expect.poll(async () => (await audioState(page)).currentTime, { timeout: 10_000 }).toBeGreaterThan(first.currentTime + 0.5);

  // Open the radio panel and turn it off for good.
  await page.getByRole("button", { name: /^Đang phát nhạc nền/ }).click();
  await page.getByRole("button", { name: "Tắt hẳn nhạc" }).click();
  await expect.poll(async () => (await audioState(page)).anyPlaying).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("gbt:bgm"))).toBe("off");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await clickEmptyArea(page);
  await expectSilentFor(page, 2000);
});

test("a click on /gui-anh-do never starts the radio", async ({ page }) => {
  await page.goto("/gui-anh-do");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await clickEmptyArea(page);
  await expectSilentFor(page, 2000);
});
