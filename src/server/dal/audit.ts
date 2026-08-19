import "server-only";

import { count, desc, eq } from "drizzle-orm";

import type { AuditAction, AuditListQuery } from "@/features/audit/schema";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { auditEvent, user } from "@/server/db/schema";

const PAGE_SIZE = 20;

export interface AuditEventDto {
  id: string;
  action: AuditAction;
  outcome: "success" | "failure";
  actorName: string | null;
  actorEmail: string | null;
  targetType: string | null;
  targetId: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface AuditEventPageDto {
  events: AuditEventDto[];
  page: number;
  pageCount: number;
  total: number;
}

export async function listAuditEvents(query: AuditListQuery): Promise<AuditEventPageDto> {
  await requireAdmin();

  const condition = query.action === "all" ? undefined : eq(auditEvent.action, query.action);
  const [{ value: total }] = await db.select({ value: count() }).from(auditEvent).where(condition);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);

  const rows = await db
    .select({
      id: auditEvent.id,
      action: auditEvent.action,
      outcome: auditEvent.outcome,
      actorName: user.name,
      actorEmail: user.email,
      targetType: auditEvent.targetType,
      targetId: auditEvent.targetId,
      requestId: auditEvent.requestId,
      createdAt: auditEvent.createdAt,
    })
    .from(auditEvent)
    .leftJoin(user, eq(auditEvent.actorUserId, user.id))
    .where(condition)
    .orderBy(desc(auditEvent.createdAt), desc(auditEvent.id))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return {
    events: rows.map((row) => ({
      ...row,
      action: row.action as AuditAction,
      outcome: row.outcome as "success" | "failure",
      createdAt: row.createdAt.toISOString(),
    })),
    page,
    pageCount,
    total,
  };
}
