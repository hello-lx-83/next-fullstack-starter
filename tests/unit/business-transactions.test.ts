import { hashPassword, verifyPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { recordAuditEvent } from "@/server/audit";
import { getCurrentSession } from "@/server/auth/session";
import { changePassword } from "@/server/dal/profile";
import { deleteOwnedArchivedProject } from "@/server/dal/projects";
import { revokeOwnedSession } from "@/server/dal/sessions";
import { createUser, deleteUser, resetUserPassword, setUserBanned } from "@/server/dal/users";
import { account, auditEvent, project, session, user } from "@/server/db/schema";

import { createTestDatabase } from "../helpers/database";

vi.mock("@/server/auth/session", () => ({ getCurrentSession: vi.fn(), requireAdmin: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/server/observability/request-context", () => ({
  getRequestContext: async () => ({ requestId: "transaction-test", userAgent: null }),
}));
let database: ReturnType<typeof createTestDatabase>;
function login(id = "admin", role = "admin") {
  vi.mocked(getCurrentSession).mockResolvedValue({ user: { id, role }, session: { id: "current" } } as Awaited<
    ReturnType<typeof getCurrentSession>
  >);
}
function getCredential() {
  const credential = database.db.select().from(account).get();
  if (!credential?.password) throw new Error("Missing credential fixture");
  return { ...credential, password: credential.password };
}
function failAudit() {
  database.sqlite.exec(
    "CREATE TRIGGER fail_audit BEFORE INSERT ON audit_event BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END",
  );
}
beforeEach(async () => {
  database = createTestDatabase();
  database.db
    .insert(user)
    .values([
      { id: "admin", name: "原管理员", email: "admin@example.com", role: "admin" },
      { id: "member", name: "用户", email: "member@example.com" },
    ])
    .run();
  database.db
    .insert(account)
    .values({
      id: "credential",
      userId: "member",
      accountId: "member",
      providerId: "credential",
      password: await hashPassword("Original123!"),
    })
    .run();
  database.db
    .insert(session)
    .values([
      { id: "current", token: "current-token", userId: "member", expiresAt: new Date(Date.now() + 60000) },
      { id: "other", token: "other-token", userId: "member", expiresAt: new Date(Date.now() + 60000) },
    ])
    .run();
  login();
});
afterEach(() => database.sqlite.close());

describe("业务操作与审计事务", () => {
  it("重置密码同步撤销所有会话并记录操作者快照", async () => {
    expect(
      await resetUserPassword(
        { userId: "member", newPassword: "Changed123!", confirmPassword: "Changed123!" },
        database.db,
      ),
    ).toBe("reset");
    expect(database.db.select().from(session).all()).toHaveLength(0);
    const credential = getCredential();
    expect(await verifyPassword({ hash: credential.password, password: "Changed123!" })).toBe(true);
    expect(database.db.select().from(auditEvent).get()).toMatchObject({
      action: "user.password.reset",
      actorName: "原管理员",
      actorEmail: "admin@example.com",
    });
  });
  it("审计失败回滚密码、会话及账号创建", async () => {
    const original = getCredential().password;
    failAudit();
    await expect(
      resetUserPassword({ userId: "member", newPassword: "Changed123!", confirmPassword: "Changed123!" }, database.db),
    ).rejects.toThrow();
    expect(getCredential().password).toBe(original);
    expect(database.db.select().from(session).all()).toHaveLength(2);
    await expect(
      createUser({ name: "新用户", email: "new@example.com", password: "Created123!" }, database.db),
    ).rejects.toThrow();
    expect(database.db.select().from(user).all()).toHaveLength(2);
    expect(database.db.select().from(account).all()).toHaveLength(1);
  });
  it("审计失败回滚停用、删除和项目删除", async () => {
    database.db
      .insert(project)
      .values({ id: "archived", ownerId: "member", name: "归档项目", status: "archived" })
      .run();
    failAudit();
    await expect(setUserBanned({ userId: "member", banned: true }, database.db)).rejects.toThrow();
    expect(database.db.select().from(user).where(eq(user.id, "member")).get()?.banned).toBe(false);
    await expect(deleteUser({ userId: "member" }, database.db)).rejects.toThrow();
    await expect(deleteOwnedArchivedProject("archived", database.db)).rejects.toThrow();
    expect(database.db.select().from(project).all()).toHaveLength(1);
    expect(database.db.select().from(session).all()).toHaveLength(2);
  });
  it("用户改名或删除不会改写审计快照", () => {
    recordAuditEvent({ action: "user.created", actorUserId: "admin" }, database.db);
    database.db.update(user).set({ name: "新姓名" }).where(eq(user.id, "admin")).run();
    database.db.delete(user).where(eq(user.id, "admin")).run();
    expect(database.db.select().from(auditEvent).get()).toMatchObject({
      actorUserId: null,
      actorName: "原管理员",
      actorEmail: "admin@example.com",
    });
  });
  it("普通用户和管理员本人不能通过重置流程改管理员密码", async () => {
    expect(
      await resetUserPassword(
        { userId: "admin", newPassword: "Changed123!", confirmPassword: "Changed123!" },
        database.db,
      ),
    ).toBe("protected");
    login("member", "user");
    expect(
      await createUser({ name: "用户", email: "new@example.com", password: "Created123!" }, database.db),
    ).toBeUndefined();
    expect(await resetUserPassword({}, database.db)).toBe("unauthorized");
  });
  it("本人修改密码保留当前会话；错误密码不写入", async () => {
    login("member", "user");
    expect(
      await changePassword(
        { currentPassword: "Wrong123!", newPassword: "Changed123!", confirmPassword: "Changed123!" },
        database.db,
      ),
    ).toBe("invalid_password");
    expect(database.db.select().from(auditEvent).all()).toHaveLength(0);
    expect(
      await changePassword(
        { currentPassword: "Original123!", newPassword: "Changed123!", confirmPassword: "Changed123!" },
        database.db,
      ),
    ).toBe("changed");
    expect(database.db.select({ id: session.id }).from(session).all()).toEqual([{ id: "current" }]);
  });
  it("审计失败回滚本人改密和会话撤销", async () => {
    login("member", "user");
    failAudit();
    await expect(
      changePassword(
        { currentPassword: "Original123!", newPassword: "Changed123!", confirmPassword: "Changed123!" },
        database.db,
      ),
    ).rejects.toThrow();
    await expect(revokeOwnedSession("other", database.db)).rejects.toThrow();
    expect(database.db.select().from(session).all()).toHaveLength(2);
    expect(await verifyPassword({ hash: getCredential().password, password: "Original123!" })).toBe(true);
  });
});
