import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentSession } from "@/server/auth/session";
import { setUserBanned } from "@/server/dal/users";
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
});
