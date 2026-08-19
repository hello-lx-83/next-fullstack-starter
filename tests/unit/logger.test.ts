import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/server/observability/logger";

describe("结构化日志", () => {
  afterEach(() => vi.restoreAllMocks());

  it("输出 JSON 并递归脱敏敏感字段", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    logger.info("test.event", {
      authorization: "Bearer secret",
      nested: { password: "Password123!", safe: "visible" },
      requestId: "request-1",
    });

    const line = String(write.mock.calls[0]?.[0]);
    const entry = JSON.parse(line) as Record<string, unknown>;
    expect(entry).toMatchObject({ event: "test.event", level: "info", requestId: "request-1" });
    expect(entry.authorization).toBe("[REDACTED]");
    expect(entry.nested).toEqual({ password: "[REDACTED]", safe: "visible" });
  });
});
