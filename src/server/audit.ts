import type { AuditAction } from "@/features/audit/schema";
import { db } from "@/server/db";
import { auditEvent } from "@/server/db/schema";
import { logger, toErrorFields } from "@/server/observability/logger";

export interface AuditEventInput {
  action: AuditAction;
  actorUserId?: string | null;
  targetType?: "project" | "session" | "user";
  targetId?: string | null;
  requestId?: string | null;
  userAgent?: string | null;
}

function truncate(value: string | null | undefined, maxLength: number): string | null {
  return value ? value.slice(0, maxLength) : null;
}

export async function recordAuditEvent(input: AuditEventInput): Promise<boolean> {
  try {
    await db.insert(auditEvent).values({
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      targetType: input.targetType ?? null,
      targetId: truncate(input.targetId, 200),
      requestId: truncate(input.requestId, 100),
      userAgent: truncate(input.userAgent, 512),
    });
    logger.info("audit.recorded", {
      action: input.action,
      actorUserId: input.actorUserId,
      requestId: input.requestId,
      targetId: input.targetId,
      targetType: input.targetType,
    });
    return true;
  } catch (error) {
    logger.error("audit.write_failed", {
      ...toErrorFields(error),
      action: input.action,
      actorUserId: input.actorUserId,
      requestId: input.requestId,
      targetId: input.targetId,
      targetType: input.targetType,
    });
    return false;
  }
}
