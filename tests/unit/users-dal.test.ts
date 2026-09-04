import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parseUserListQuery } from "@/features/users/schema";
import { getCurrentSession, requireAdmin } from "@/server/auth/session";
import { listUsers, setUserBanned } from "@/server/dal/users";
import { createDatabase } from "@/server/db";
import { session, user } from "@/server/db/schema";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("@/server/auth/session", () => ({ getCurrentSession: vi.fn(), requireAdmin: vi.fn() }));

const mockedGetCurrentSession = vi.mocked(getCurrentSession);

function mockSession(id: string, role: "admin" | "user") {
  mockedGetCurrentSession.mockResolvedValue({ user: { id, role } } as Awaited<ReturnType<typeof getCurrentSession>>);
}

describe("用户 DAL", () => {
  let database: ReturnType<typeof createDatabase>;

  beforeEach(async () => {
    database = createDatabase(":memory:");
    database.sqlite.exec(
      readFileSync(resolve("drizzle/0000_abandoned_fat_cobra.sql"), "utf8").replaceAll("--> statement-breakpoint", ""),
    );
    await database.db.insert(user).values([
      { id: "admin", name: "管理员", email: "admin@example.com", role: "admin" },
      { id: "user-1", name: "普通用户", email: "user@example.com" },
    ]);
    await database.db.insert(session).values({
      id: "session-1",
      token: "token-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
    });
  });

  afterEach(() => database.sqlite.close());

  it("超级管理员可以停用普通用户并撤销其会话", async () => {
    mockSession("admin", "admin");
    await expect(setUserBanned({ userId: "user-1", banned: true }, database.db)).resolves.toBe("updated");
    expect((await database.db.select().from(user).where(eq(user.id, "user-1")).get())?.banned).toBe(true);
    expect(await database.db.select().from(session)).toHaveLength(0);
  });

  it("拒绝停用超级管理员", async () => {
    mockSession("admin", "admin");
    await expect(setUserBanned({ userId: "admin", banned: true }, database.db)).resolves.toBe("protected");
  });

  it("拒绝普通用户执行管理操作", async () => {
    mockSession("user-1", "user");
    await expect(setUserBanned({ userId: "user-1", banned: false }, database.db)).resolves.toBe("unauthorized");
  });

  it("按角色、状态和姓名或邮箱组合筛选，搜索通配符按文字处理", async () => {
    await database.db.insert(user).values([
      { id: "match", name: "完成度 100%", email: "match@example.com", role: "user", banned: true },
      { id: "other", name: "其他用户", email: "other@example.com", role: "user" },
    ]);
    const query = parseUserListQuery({ q: "%", role: "user", status: "banned" });
    const result = await listUsers(query, database.db);
    expect(result.total).toBe(1);
    expect(result.users.map((item) => item.id)).toEqual(["match"]);
    expect((await listUsers({ ...query, q: "MATCH@EXAMPLE" }, database.db)).users[0]?.id).toBe("match");
    expect((await listUsers({ ...query, role: "admin" }, database.db)).total).toBe(0);
  });

  it("分页保持稳定排序且只返回当前页的必要字段", async () => {
    await database.db.insert(user).values(
      Array.from({ length: 23 }, (_, i) => ({
        id: `page-${String(i).padStart(2, "0")}`,
        name: "分页用户",
        email: `page-${i}@example.com`,
      })),
    );
    const query = parseUserListQuery({ q: "分页用户", pageSize: "10", sort: "name-asc" });
    const first = await listUsers(query, database.db);
    const second = await listUsers({ ...query, page: 2 }, database.db);
    const last = await listUsers({ ...query, page: 3 }, database.db);
    expect(first.total).toBe(23);
    expect(first.users).toHaveLength(10);
    expect(second.users[0]?.id).toBe("page-10");
    expect(last.users).toHaveLength(3);
    expect(new Set([...first.users, ...second.users, ...last.users].map((item) => item.id)).size).toBe(23);
    expect(Object.keys(first.users[0]).sort()).toEqual(["banned", "createdAt", "email", "id", "name", "role"]);
  });

  it("鉴权失败时拒绝读取用户列表", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("unauthorized"));
    await expect(listUsers(parseUserListQuery({}), database.db)).rejects.toThrow("unauthorized");
  });
});
