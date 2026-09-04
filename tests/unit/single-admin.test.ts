import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { enforceSingleAdmin } from "@/server/auth/single-admin";
import { user } from "@/server/db/schema";

import { createTestDatabase } from "../helpers/database";

describe("唯一超级管理员", () => {
  let database: ReturnType<typeof createTestDatabase>;

  beforeEach(async () => {
    database = createTestDatabase();
    await database.db.insert(user).values([
      { id: "admin-old", name: "旧管理员", email: "old@example.com", role: "admin" },
      { id: "admin-main", name: "待校准", email: "admin@example.com", role: "admin", banned: true },
      { id: "user-1", name: "普通用户", email: "user@example.com" },
    ]);
  });

  afterEach(() => database.sqlite.close());

  it("只保留指定账号为启用的超级管理员", async () => {
    enforceSingleAdmin(database.db, { id: "admin-main", name: "超级管理员" });

    const rows = await database.db
      .select({ id: user.id, name: user.name, role: user.role, banned: user.banned })
      .from(user);
    expect(rows.filter((row) => row.role === "admin")).toEqual([
      { id: "admin-main", name: "超级管理员", role: "admin", banned: false },
    ]);
    expect(rows.find((row) => row.id === "admin-old")?.role).toBe("user");
  });

  it("目标账号不存在时回滚，不会清空现有管理员", async () => {
    expect(() => enforceSingleAdmin(database.db, { id: "missing", name: "不存在" })).toThrow("超级管理员账号不存在");
    expect((await database.db.select().from(user)).filter((row) => row.role === "admin")).toHaveLength(2);
  });
});
