import "server-only";

import { and, asc, count, desc, eq, or, type SQL, sql } from "drizzle-orm";

import { type AuditAction, type AuditListQuery, auditListQuerySchema } from "@/features/audit/schema";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { auditEvent, user } from "@/server/db/schema";

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

export async function listAuditEvents(input: AuditListQuery, database: typeof db = db): Promise<AuditEventPageDto> {
  await requireAdmin();

  const query = auditListQuerySchema.parse(input);
  const conditions: SQL[] = [];
  if (query.action !== "all") conditions.push(eq(auditEvent.action, query.action));
  if (query.outcome !== "all") conditions.push(eq(auditEvent.outcome, query.outcome));
  if (query.q) {
    const match = or(
      sql`instr(lower(${user.name}), lower(${query.q})) > 0`,
      sql`instr(lower(${user.email}), lower(${query.q})) > 0`,
      sql`instr(lower(${auditEvent.targetId}), lower(${query.q})) > 0`,
      sql`instr(lower(${auditEvent.targetType}), lower(${query.q})) > 0`,
      sql`instr(lower(${auditEvent.requestId}), lower(${query.q})) > 0`,
    );
    if (match) conditions.push(match);
  }
  const condition = and(...conditions);
  const [{ value: total }] = await database
    .select({ value: count() })
    .from(auditEvent)
    .leftJoin(user, eq(auditEvent.actorUserId, user.id))
    .where(condition);
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);

  const rows = await database
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
    .orderBy(query.sort === "created-asc" ? asc(auditEvent.createdAt) : desc(auditEvent.createdAt), desc(auditEvent.id))
    .limit(query.pageSize)
    .offset((page - 1) * query.pageSize);

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
