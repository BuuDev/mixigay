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

// No autoplay (ADR-019): the audio file is only downloaded by visitors who open the radio.
test("stays silent on load and on clicks elsewhere; opening the radio plays Airport Lounge at 0.3; 'Tắt hẳn nhạc' sticks", async ({ page }) => {
  const audioRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/music/")) audioRequests.push(r.url());
  });
  await page.goto("/lich");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect((await audioState(page)).count).toBeGreaterThan(0);
  await clickEmptyArea(page);
  await expectSilentFor(page, 2000);
  expect(audioRequests, "no music downloaded before the radio is opened").toEqual([]);

  await page.getByRole("button", { name: "Mở đài phát thanh Bộ Tộc" }).click();
  await expect.poll(async () => (await audioState(page)).anyPlaying, { timeout: 15_000 }).toBe(true);
  const first = await audioState(page);
  expect(first.volume).toBeCloseTo(0.3, 2);
  expect(first.src).toMatch(/\/music\/airport-lounge\.m4a$/);
  await expect.poll(async () => (await audioState(page)).currentTime, { timeout: 10_000 }).toBeGreaterThan(first.currentTime + 0.5);

  // Turn it off for good: opening the radio later does not start it.
  await page.getByRole("button", { name: "Tắt hẳn nhạc" }).click();
  await expect.poll(async () => (await audioState(page)).anyPlaying).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("gbt:bgm"))).toBe("off");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Mở đài phát thanh Bộ Tộc" }).click();
  await expectSilentFor(page, 2000);
});

test("a click on /gui-anh-do never starts the radio", async ({ page }) => {
  await page.goto("/gui-anh-do");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await clickEmptyArea(page);
  await expectSilentFor(page, 2000);
});
