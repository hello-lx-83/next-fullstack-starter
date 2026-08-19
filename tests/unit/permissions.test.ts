import { describe, expect, it } from "vitest";

import { canManageProject, isAdmin } from "@/server/auth/permissions";

describe("RBAC", () => {
  it("识别管理员及多角色字符串", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("user,admin")).toBe(true);
    expect(isAdmin("user")).toBe(false);
  });

  it("普通用户只能管理自己的项目", () => {
    expect(canManageProject("user", "u1", "u1")).toBe(true);
    expect(canManageProject("user", "u1", "u2")).toBe(false);
    expect(canManageProject("admin", "admin", "u2")).toBe(true);
  });
});
