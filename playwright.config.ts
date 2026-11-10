import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@playwright/test";

// E2E suite (docs/06-setup.md). Runs against a production build: `npm run build` first,
// then `npm run e2e`. The server reuses whatever already listens on the port, so a
// mock build (empty NEXT_PUBLIC_SUPABASE_URL) or a dev-project build both work; specs
// that need Supabase are left out (testIgnore) when the env is missing. Which spec runs on
// which project is decided here (tags / testIgnore) rather than with test.skip in specs.
// Env files are loaded the same way Next.js does, so fixtures see the service-role key.
loadEnvConfig(process.cwd(), false, { info() {}, error: console.error });

const PORT = 3311;
const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    // System Google Chrome: no `playwright install` needed.
    channel: "chrome",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Account flows and the radio run once, on desktop; "@phone"/"@desktop" tags pin layout-only tests.
    { name: "desktop", grepInvert: /@phone/, testIgnore: hasSupabase ? [] : [/community\.spec/], use: { viewport: { width: 1366, height: 900 } } },
    {
      name: "phone",
      grepInvert: /@desktop/,
      testIgnore: [/community\.spec/, /radio\.spec/],
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
    },
  ],
  // Started only when no E2E_BASE_URL is given; an already running `next start` is reused.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npm run start -- -p ${PORT}`, url: baseURL, reuseExistingServer: true, timeout: 60_000, stdout: "ignore", stderr: "pipe" },
});
