import "server-only";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, eq, ne } from "drizzle-orm";

import { passwordSchema, profileSchema } from "@/features/profile/schema";
import { recordAuditEvent } from "@/server/audit";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { account, session, user } from "@/server/db/schema";
import { getRequestContext } from "@/server/observability/request-context";

export async function updateProfile(input: unknown, database: typeof db = db) {
  const current = await getCurrentSession();
  if (!current) return false;
  const parsed = profileSchema.parse(input);
  return Boolean(
    database
      .update(user)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(user.id, current.user.id))
      .returning({ id: user.id })
      .get(),
  );
}

export async function changePassword(
  input: unknown,
  database: typeof db = db,
): Promise<"changed" | "unauthorized" | "invalid_password"> {
  const current = await getCurrentSession();
  if (!current) return "unauthorized";
  const parsed = passwordSchema.parse(input);
  const credential = database
    .select({ id: account.id, password: account.password })
    .from(account)
    .where(and(eq(account.userId, current.user.id), eq(account.providerId, "credential")))
    .get();
  if (!credential?.password || !(await verifyPassword({ hash: credential.password, password: parsed.currentPassword })))
    return "invalid_password";
  const previousPassword = credential.password;
  const password = await hashPassword(parsed.newPassword);
  const context = await getRequestContext();
  return database.transaction((tx) => {
    // A concurrent reset must not be overwritten using a previously verified password.
    const updated = tx
      .update(account)
      .set({ password, updatedAt: new Date() })
      .where(and(eq(account.id, credential.id), eq(account.password, previousPassword)))
      .returning({ id: account.id })
      .get();
    if (!updated) return "invalid_password";
    tx.delete(session)
      .where(and(eq(session.userId, current.user.id), ne(session.id, current.session.id)))
      .run();
    recordAuditEvent(
      {
        action: "user.password.changed",
        actorUserId: current.user.id,
        targetId: current.user.id,
        targetType: "user",
        ...context,
      },
      tx,
    );
    return "changed";
  });
}
