import { defineConfig, devices } from "@playwright/test";

const testEnv = {
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_NAME: "测试管理员",
  ADMIN_PASSWORD: "AdminPass123!",
  BETTER_AUTH_SECRET: "e2e-test-secret-at-least-32-characters-long",
  BETTER_AUTH_URL: "http://localhost:3100",
  DATABASE_URL: "./data/e2e.db",
};

export default defineConfig({
  testDir: "./tests/e2e",
  globalTeardown: "./tests/e2e/teardown.ts",
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: testEnv.BETTER_AUTH_URL,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        extraHTTPHeaders: { "x-forwarded-for": "127.0.0.2" },
      },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: "tsx tests/e2e/server.ts",
    env: testEnv,
    url: testEnv.BETTER_AUTH_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
