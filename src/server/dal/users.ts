import "server-only";

import { and, asc, count, desc, eq, or, type SQL, sql } from "drizzle-orm";

import { type UserListQuery, userListQuerySchema } from "@/features/users/schema";
import { isAdmin } from "@/server/auth/permissions";
import { getCurrentSession, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { session as authSession, user } from "@/server/db/schema";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
}

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

  return database.transaction((tx) => {
    const target = tx.select({ role: user.role }).from(user).where(eq(user.id, input.userId)).get();
    if (!target) return "not_found";
    if (isAdmin(target.role)) return "protected";

    tx.delete(user).where(eq(user.id, input.userId)).run();
    return "deleted";
  });
}

export async function validatePasswordResetTarget(
  input: { userId: string },
  database: typeof db = db,
): Promise<"allowed" | "unauthorized" | "protected" | "not_found"> {
  const currentSession = await getCurrentSession();
  if (!currentSession || !isAdmin(currentSession.user.role)) return "unauthorized";
  if (input.userId === currentSession.user.id) return "protected";

  const target = await database.select({ role: user.role }).from(user).where(eq(user.id, input.userId)).get();
  if (!target) return "not_found";
  return isAdmin(target.role) ? "protected" : "allowed";
}

export async function revokeUserSessionsAfterPasswordReset(
  input: { userId: string },
  database: typeof db = db,
): Promise<void> {
  await database.delete(authSession).where(eq(authSession.userId, input.userId));
}
