import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentSession } from "@/server/auth/session";
import { createProject, toggleOwnedProjectArchive, updateOwnedProject } from "@/server/dal/projects";
import { createDatabase } from "@/server/db";
import { project, user } from "@/server/db/schema";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("@/server/auth/session", () => ({ getCurrentSession: vi.fn() }));

const mockedGetCurrentSession = vi.mocked(getCurrentSession);

function mockSession(id: string, role: "admin" | "user" = "user") {
  mockedGetCurrentSession.mockResolvedValue({ user: { id, role } } as Awaited<ReturnType<typeof getCurrentSession>>);
}

describe("Projects DAL", () => {
  let database: ReturnType<typeof createDatabase>;

  beforeEach(async () => {
    database = createDatabase(":memory:");
    const migrationPath = resolve("drizzle/0000_abandoned_fat_cobra.sql");
    database.sqlite.exec(readFileSync(migrationPath, "utf8").replaceAll("--> statement-breakpoint", ""));
    await database.db.insert(user).values([
      { id: "u1", name: "用户一", email: "u1@example.com" },
      { id: "u2", name: "用户二", email: "u2@example.com" },
    ]);
  });

  afterEach(() => database.sqlite.close());

  it("拒绝普通用户修改他人的项目，并允许管理员修改", async () => {
    mockSession("u1");
    const created = await createProject({ name: "原项目", description: "" }, database.db);
    if (!created) throw new Error("项目创建失败");

    mockSession("u2");
    const denied = await updateOwnedProject(created.id, { name: "越权", description: "" }, database.db);
    expect(denied).toBeUndefined();

    mockSession("admin", "admin");
    const allowed = await updateOwnedProject(created.id, { name: "管理员更新", description: "" }, database.db);
    expect(allowed?.id).toBe(created.id);
    const row = await database.db.select().from(project).where(eq(project.id, created.id)).get();
    expect(row?.name).toBe("管理员更新");
  });

  it("所有者可以归档并恢复项目", async () => {
    mockSession("u1");
    const created = await createProject({ name: "可归档", description: "" }, database.db);
    if (!created) throw new Error("项目创建失败");
    await toggleOwnedProjectArchive(created.id, database.db);
    expect((await database.db.select().from(project).where(eq(project.id, created.id)).get())?.status).toBe("archived");
    await toggleOwnedProjectArchive(created.id, database.db);
    expect((await database.db.select().from(project).where(eq(project.id, created.id)).get())?.status).toBe("active");
  });

  it("未登录时拒绝创建项目", async () => {
    mockedGetCurrentSession.mockResolvedValue(null);
    await expect(createProject({ name: "未授权", description: "" }, database.db)).resolves.toBeUndefined();
    expect(await database.db.select().from(project)).toHaveLength(0);
  });
});
