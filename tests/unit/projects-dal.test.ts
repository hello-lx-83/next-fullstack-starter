import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentSession } from "@/server/auth/session";
import {
  createProject,
  deleteOwnedArchivedProject,
  getProject,
  listProjects,
  setOwnedProjectsStatus,
  toggleOwnedProjectArchive,
  updateOwnedProject,
} from "@/server/dal/projects";
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

  it("按权限、搜索与状态分页项目", async () => {
    mockSession("u1");
    await createProject({ name: "Alpha", description: "first" }, database.db);
    const archived = await createProject({ name: "Beta", description: "second" }, database.db);
    if (!archived) throw new Error("项目创建失败");
    await toggleOwnedProjectArchive(archived.id, database.db);

    mockSession("u2");
    await createProject({ name: "Alpha other", description: "hidden" }, database.db);

    mockSession("u1");
    const result = await listProjects(
      { q: "Alpha", status: "active", sort: "name-asc", page: 1, pageSize: 10 },
      database.db,
    );
    expect(result.total).toBe(1);
    expect(result.projects.map((item) => item.name)).toEqual(["Alpha"]);
  });

  it("将搜索中的 SQL 通配符作为普通字符处理", async () => {
    mockSession("u1");
    await createProject({ name: "完成度 100%", description: "包含百分号" }, database.db);
    await createProject({ name: "普通项目", description: "没有特殊字符" }, database.db);

    const result = await listProjects(
      { q: "%", status: "all", sort: "updated-desc", page: 1, pageSize: 10 },
      database.db,
    );
    expect(result.projects.map((item) => item.name)).toEqual(["完成度 100%"]);
  });

  it("限制详情访问，并只允许永久删除已归档项目", async () => {
    mockSession("u1");
    const created = await createProject({ name: "详情项目", description: "" }, database.db);
    if (!created) throw new Error("项目创建失败");
    expect((await getProject(created.id, database.db))?.name).toBe("详情项目");
    expect(await deleteOwnedArchivedProject(created.id, database.db)).toBeUndefined();

    mockSession("u2");
    expect(await getProject(created.id, database.db)).toBeUndefined();
    expect(await setOwnedProjectsStatus([created.id], "archived", database.db)).toEqual([]);

    mockSession("u1");
    await setOwnedProjectsStatus([created.id], "archived", database.db);
    expect((await deleteOwnedArchivedProject(created.id, database.db))?.id).toBe(created.id);
  });
});
