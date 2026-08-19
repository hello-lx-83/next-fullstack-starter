import { describe, expect, it } from "vitest";

import { getServerEnv } from "@/config/env";

describe("服务端环境变量", () => {
  it("解析有效配置", () => {
    const env = getServerEnv({
      BETTER_AUTH_SECRET: "a-secure-secret-that-is-longer-than-32-characters",
      BETTER_AUTH_URL: "http://localhost:3009",
      DATABASE_URL: "./data/test.db",
    });
    expect(env.DATABASE_URL).toBe("./data/test.db");
  });

  it("拒绝过短的认证密钥", () => {
    expect(() => getServerEnv({ BETTER_AUTH_SECRET: "short" })).toThrow();
  });
});
