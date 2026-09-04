import { eq } from "drizzle-orm";

import type { AuditAction } from "@/features/audit/schema";
import { db } from "@/server/db";
import type { AppDatabase, AppTransaction } from "@/server/db/factory";
import { auditEvent, user } from "@/server/db/schema";

export interface AuditEventInput {
  action: AuditAction;
  actorUserId?: string | null;
  targetType?: "project" | "session" | "user";
  targetId?: string | null;
  requestId?: string | null;
  userAgent?: string | null;
}

// Use the mutation's transaction: audit failures must roll back the operation.
export function recordAuditEvent(input: AuditEventInput, database: AppDatabase | AppTransaction = db): void {
  const actor = input.actorUserId
    ? database.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, input.actorUserId)).get()
    : undefined;
  database
    .insert(auditEvent)
    .values({
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      actorName: actor?.name ?? null,
      actorEmail: actor?.email ?? null,
      targetType: input.targetType ?? null,
      targetId: input.targetId?.slice(0, 200) ?? null,
      requestId: input.requestId?.slice(0, 100) ?? null,
      userAgent: input.userAgent?.slice(0, 512) ?? null,
    })
    .run();
}
