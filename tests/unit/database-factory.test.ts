import { describe, expect, it } from "vitest";

import { getDatabaseEnv } from "@/config/env";

import { spawnSync } from "node:child_process";

describe("数据库工厂独立性", () => {
  it("无需认证配置即可解析数据库配置", () => {
    expect(getDatabaseEnv({ DATABASE_URL: ":memory:" }).DATABASE_URL).toBe(":memory:");
  });
  it("仅导入工厂不会读取应用环境或创建默认连接", () => {
    const env = { ...process.env };
    delete env.BETTER_AUTH_SECRET;
    // An accidental application connection would fail trying to open this directory.
    env.DATABASE_URL = ".";
    const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module"], {
      env,
      encoding: "utf8",
      timeout: 10000,
      input:
        'const { createDatabase } = await import("./src/server/db/factory.ts"); const connection = createDatabase(":memory:"); connection.sqlite.close();',
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
  });
});
