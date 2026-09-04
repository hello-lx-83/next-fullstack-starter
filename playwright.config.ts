import { defineConfig, devices } from "@playwright/test";

import { testEnv } from "./tests/e2e/environment";

const configuredBrowserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL;
const browserChannel =
  configuredBrowserChannel === "chrome" || configuredBrowserChannel === "msedge" ? configuredBrowserChannel : undefined;
const browserUse = browserChannel ? { channel: browserChannel } : {};

export default defineConfig({
  testDir: "./tests/e2e",
  globalTeardown: "./tests/e2e/teardown.ts",
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: testEnv.BETTER_AUTH_URL,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...browserUse },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        ...browserUse,
        extraHTTPHeaders: { "x-forwarded-for": "127.0.0.2" },
      },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: "tsx tests/e2e/server.ts",
    env: testEnv,
    url: `${testEnv.BETTER_AUTH_URL}/api/health/ready`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
