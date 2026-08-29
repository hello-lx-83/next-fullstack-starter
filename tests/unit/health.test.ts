import { describe, expect, it } from "vitest";

import { getIntegrityStatus, getLivenessStatus, getReadinessStatus } from "@/server/health";

describe("健康检查", () => {
  it("区分进程存活、数据库就绪与深度完整性检查", () => {
    expect(getLivenessStatus()).toEqual({ status: "ok" });
    expect(getReadinessStatus()).toEqual({ status: "ok", database: "ok" });
    expect(getIntegrityStatus()).toEqual({ status: "ok", database: "ok" });
  });
});
