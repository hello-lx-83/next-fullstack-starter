import { describe, expect, it } from "vitest";

import { getSafeDashboardPath } from "@/features/auth/redirect";

describe("登录后回跳", () => {
  it("允许工作台内部路径", () => {
    expect(getSafeDashboardPath("/dashboard/projects")).toBe("/dashboard/projects");
    expect(getSafeDashboardPath(["/dashboard/profile", "/dashboard/users"])).toBe("/dashboard/profile");
  });

  it("拒绝外部和相似路径", () => {
    expect(getSafeDashboardPath("https://example.com")).toBe("/dashboard");
    expect(getSafeDashboardPath("//example.com")).toBe("/dashboard");
    expect(getSafeDashboardPath("/dashboard-evil")).toBe("/dashboard");
  });
});
