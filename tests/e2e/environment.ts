import { z } from "zod";

import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

// Propagate one run ID to the web server and Playwright workers.
const runId = z.uuid().parse(process.env.PLAYWRIGHT_RUN_ID ?? randomUUID());
process.env.PLAYWRIGHT_RUN_ID = runId;

export const testDirectory = resolve("data/e2e", runId);
export const pidFile = resolve(testDirectory, "server.pid");
export const testEnv = {
  PLAYWRIGHT_RUN_ID: runId,
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_NAME: "测试管理员",
  ADMIN_PASSWORD: "AdminPass123!",
  BETTER_AUTH_SECRET: "e2e-test-secret-at-least-32-characters-long",
  BETTER_AUTH_URL: "http://localhost:3100",
  DATABASE_URL: resolve(testDirectory, "test.db"),
};
