import { test as base } from "@playwright/test";
import Database from "better-sqlite3";

import { testEnv } from "./environment";

export { expect } from "@playwright/test";

export const test = base.extend<{ isolatedRateLimits: undefined }>({
  isolatedRateLimits: [
    // Each case gets a fresh budget, while requests within the case still exercise real rate limits.
    async ({ baseURL }, use) => {
      if (baseURL !== testEnv.BETTER_AUTH_URL) throw new Error("只能重置本地 E2E 服务的测试限流");
      const database = new Database(testEnv.DATABASE_URL, { fileMustExist: true });
      try {
        database.pragma("busy_timeout = 5000");
        database.prepare("DELETE FROM rate_limit").run();
      } finally {
        database.close();
      }
      await use(undefined);
    },
    { auto: true },
  ],
});
