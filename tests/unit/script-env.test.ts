import { afterEach, describe, expect, it } from "vitest";

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const directories: string[] = [];

function readEnvironment(mode: "development" | "production" | "test", override?: string) {
  const directory = mkdtempSync(join(tmpdir(), "starter-env-"));
  directories.push(directory);
  writeFileSync(join(directory, ".env"), "INFRA_TEST_BASE=base\nINFRA_TEST_VALUE=base\n");
  writeFileSync(join(directory, ".env.local"), "INFRA_TEST_VALUE=local\n");
  writeFileSync(join(directory, ".env.production"), "INFRA_TEST_VALUE=production\n");
  writeFileSync(join(directory, ".env.production.local"), "INFRA_TEST_VALUE=production-local\n");
  writeFileSync(join(directory, ".env.test"), "INFRA_TEST_VALUE=test\n");
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: mode };
  delete env.__NEXT_PROCESSED_ENV;
  delete env.INFRA_TEST_BASE;
  delete env.INFRA_TEST_VALUE;
  if (override) env.INFRA_TEST_VALUE = override;

  const moduleUrl = pathToFileURL(resolve("scripts/lib/load-env.ts")).href;
  const code = `
    import { loadLocalEnv } from ${JSON.stringify(moduleUrl)};
    loadLocalEnv(${JSON.stringify(directory)});
    console.log(JSON.stringify({ base: process.env.INFRA_TEST_BASE, value: process.env.INFRA_TEST_VALUE }));
  `;
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], {
    env,
    encoding: "utf8",
    timeout: 10_000,
  });
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout.trim());
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("命令行环境配置与 Next.js 一致", () => {
  it("合并 .env 与 .env.local，而不是忽略基础配置", () => {
    expect(readEnvironment("development")).toEqual({ base: "base", value: "local" });
  });

  it("生产环境使用对应的最高优先级文件", () => {
    expect(readEnvironment("production")).toEqual({ base: "base", value: "production-local" });
  });

  it("显式进程环境优先于文件", () => {
    expect(readEnvironment("production", "injected")).toEqual({ base: "base", value: "injected" });
  });

  it("测试环境忽略 .env.local", () => {
    expect(readEnvironment("test")).toEqual({ base: "base", value: "test" });
  });
});
