import "server-only";

import { and, asc, eq } from "drizzle-orm";

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

export async function listUsers(): Promise<UserDto[]> {
  await requireAdmin();
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.createdAt));

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
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
