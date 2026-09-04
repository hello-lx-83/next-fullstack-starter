import "server-only";

import { hashPassword } from "better-auth/crypto";
import { and, asc, count, desc, eq, or, type SQL, sql } from "drizzle-orm";

import type { UserDto } from "@/features/users/contracts";
import {
  createUserSchema,
  resetUserPasswordSchema,
  type UserListQuery,
  userListQuerySchema,
} from "@/features/users/schema";
import { recordAuditEvent } from "@/server/audit";
import { isAdmin } from "@/server/auth/permissions";
import { getCurrentSession, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { account, session as authSession, user } from "@/server/db/schema";
import { getRequestContext } from "@/server/observability/request-context";

export async function listUsers(
  input: UserListQuery,
  database: typeof db = db,
): Promise<{ users: UserDto[]; total: number }> {
  await requireAdmin();
  const query = userListQuerySchema.parse(input);
  const conditions: SQL[] = [];
  if (query.role !== "all") conditions.push(eq(user.role, query.role));
  if (query.status !== "all") conditions.push(eq(user.banned, query.status === "banned"));
  if (query.q) {
    const match = or(
      sql`instr(lower(${user.name}), lower(${query.q})) > 0`,
      sql`instr(lower(${user.email}), lower(${query.q})) > 0`,
    );
    if (match) conditions.push(match);
  }
  const where = and(...conditions);
  const order = {
    "created-desc": desc(user.createdAt),
    "created-asc": asc(user.createdAt),
    "name-asc": asc(user.name),
    "name-desc": desc(user.name),
  };
  const [rows, totals] = await Promise.all([
    database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(where)
      .orderBy(order[query.sort], asc(user.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    database.select({ total: count() }).from(user).where(where),
  ]);
  return {
    users: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    total: totals[0]?.total ?? 0,
  };
}

export async function setUserBanned(
  input: { userId: string; banned: boolean },
  database: typeof db = db,
): Promise<"updated" | "unauthorized" | "protected" | "not_found"> {
  const currentSession = await getCurrentSession();
  if (!currentSession || !isAdmin(currentSession.user.role)) return "unauthorized";
  if (input.userId === currentSession.user.id) return "protected";

  const context = await getRequestContext();
  return database.transaction((tx) => {
    const updated = tx
      .update(user)
      .set({
        banned: input.banned,
        banReason: input.banned ? "由超级管理员停用" : null,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(and(eq(user.id, input.userId), eq(user.role, "user")))
      .returning({ id: user.id })
      .get();

    if (!updated) return "not_found";
    if (input.banned) tx.delete(authSession).where(eq(authSession.userId, input.userId)).run();
    recordAuditEvent(
      {
        action: "user.status.changed",
        actorUserId: currentSession.user.id,
        targetId: input.userId,
        targetType: "user",
        ...context,
      },
      tx,
    );
    return "updated";
  });
}

export async function deleteUser(
  input: { userId: string },
  database: typeof db = db,
): Promise<"deleted" | "unauthorized" | "protected" | "not_found"> {
  const currentSession = await getCurrentSession();
  if (!currentSession || !isAdmin(currentSession.user.role)) return "unauthorized";
  if (input.userId === currentSession.user.id) return "protected";

  const context = await getRequestContext();
  return database.transaction((tx) => {
    const target = tx.select({ role: user.role }).from(user).where(eq(user.id, input.userId)).get();
    if (!target) return "not_found";
    if (isAdmin(target.role)) return "protected";

    tx.delete(user).where(eq(user.id, input.userId)).run();
    recordAuditEvent(
      {
        action: "user.deleted",
        actorUserId: currentSession.user.id,
        targetId: input.userId,
        targetType: "user",
        ...context,
      },
      tx,
    );
    return "deleted";
  });
}

export async function createUser(input: unknown, database: typeof db = db) {
  const currentSession = await getCurrentSession();
  if (!currentSession || !isAdmin(currentSession.user.role)) return undefined;
  const parsed = createUserSchema.parse(input);
  const password = await hashPassword(parsed.password);
  const context = await getRequestContext();
  return database.transaction((tx) => {
    const id = crypto.randomUUID();
    tx.insert(user).values({ id, name: parsed.name, email: parsed.email, role: "user" }).run();
    tx.insert(account)
      .values({ id: crypto.randomUUID(), userId: id, accountId: id, providerId: "credential", password })
      .run();
    recordAuditEvent(
      { action: "user.created", actorUserId: currentSession.user.id, targetId: id, targetType: "user", ...context },
      tx,
    );
    return { id };
  });
}

export async function resetUserPassword(
  input: unknown,
  database: typeof db = db,
): Promise<"reset" | "unauthorized" | "protected" | "not_found"> {
  const currentSession = await getCurrentSession();
  if (!currentSession || !isAdmin(currentSession.user.role)) return "unauthorized";
  const parsed = resetUserPasswordSchema.parse(input);
  if (parsed.userId === currentSession.user.id) return "protected";
  const target = database.select({ role: user.role }).from(user).where(eq(user.id, parsed.userId)).get();
  if (!target) return "not_found";
  if (isAdmin(target.role)) return "protected";
  const password = await hashPassword(parsed.newPassword);
  const context = await getRequestContext();
  return database.transaction((tx) => {
    const target = tx.select({ role: user.role }).from(user).where(eq(user.id, parsed.userId)).get();
    if (!target) return "not_found";
    if (isAdmin(target.role)) return "protected";
    const credential = tx
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, parsed.userId), eq(account.providerId, "credential")))
      .get();
    if (credential)
      tx.update(account).set({ password, updatedAt: new Date() }).where(eq(account.id, credential.id)).run();
    else
      tx.insert(account)
        .values({
          id: crypto.randomUUID(),
          userId: parsed.userId,
          accountId: parsed.userId,
          providerId: "credential",
          password,
        })
        .run();
    tx.delete(authSession).where(eq(authSession.userId, parsed.userId)).run();
    recordAuditEvent(
      {
        action: "user.password.reset",
        actorUserId: currentSession.user.id,
        targetId: parsed.userId,
        targetType: "user",
        ...context,
      },
      tx,
    );
    return "reset";
  });
}
