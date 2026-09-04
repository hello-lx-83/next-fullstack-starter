import type { AuditAction } from "./schema";

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
