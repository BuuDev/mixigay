import { test as base, expect, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient, hasSupabase } from "./supabase";

export { expect };
export { hasSupabase };

interface Options {
  /**
   * "off" (default) stores the radio preference as off before any page script runs: the
   * background radio streams audio forever and would keep "networkidle" from settling.
   * radio.spec.ts sets "on" to test the radio itself.
   */
  radio: "on" | "off";
}

interface Fixtures {
  /** Service-role client for the dev project; the test is skipped when the env is missing. */
  supabaseAdmin: SupabaseClient;
  /** Page errors and console.error lines collected for the whole test. */
  errors: string[];
}

// Fixture callbacks name their second argument `provide` (Playwright calls it `use`) so the
// React Hooks lint rule does not mistake it for React's `use()`.
export const test = base.extend<Options & Fixtures>({
  radio: ["off", { option: true }],
  context: async ({ context, radio }, provide) => {
    if (radio === "off") await context.addInitScript(() => localStorage.setItem("gbt:bgm", "off"));
    await provide(context);
  },
  supabaseAdmin: async ({}, provide) => {
    // playwright.config.ts leaves community specs out when the env is missing; reaching here without it is a setup error.
    if (!hasSupabase) throw new Error("needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (dev project)");
    await provide(createAdminClient());
  },
  errors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const where = m.location().url;
      // A third-party image (Steam, YouTube) the optimizer could not fetch: the network's
      // fault, not the page's. Our own failing resources still count.
      if (m.text().startsWith("Failed to load resource") && /\/_next\/image\?url=https?%3A/.test(where)) return;
      errors.push(`console.error: ${m.text()} (${where})`);
    });
    await provide(errors);
  },
});

/** The home page shows the "Nhóm lửa" intro once per device per day: skip it if it is up. */
export async function dismissIntro(page: Page) {
  const skip = page.getByRole("button", { name: "Vào thẳng" });
  try {
    await skip.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    return; // already seen today (or not the home page)
  }
  await skip.click();
  await expect(page.getByRole("dialog", { name: "Màn nhóm lửa" })).toBeHidden();
}

/**
 * Creates a fan account through the "Vào Bộ Tộc" dialog (Supabase mode) and signs in.
 * Returns the generated passphrase.
 */
export async function signUpThroughDialog(page: Page, handle: string, displayName: string): Promise<string> {
  await page.getByRole("banner").getByRole("button", { name: "Vào Bộ Tộc", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByRole("tab", { name: "Tạo tài khoản" }).click();
  await dialog.locator("input[name=handle]").fill(handle);
  await dialog.locator("input[name=displayName]").fill(displayName);
  const passphrase = await dialog.locator("input[name=passphrase]").inputValue();
  await dialog.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();
  await expect(dialog.getByText("Lưu mã khóa này lại")).toBeVisible({ timeout: 20_000 });
  await expect(dialog.locator("p.font-mono")).toHaveText(passphrase);
  await dialog.getByRole("button", { name: "Tôi đã lưu" }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: displayName })).toBeVisible({ timeout: 20_000 });
  return passphrase;
}
