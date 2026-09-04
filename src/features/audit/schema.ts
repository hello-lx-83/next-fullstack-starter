import { z } from "zod";

export const AUDIT_ACTION_VALUES = [
  "auth.session.created",
  "auth.session.revoked",
  "project.deleted",
  "user.created",
  "user.deleted",
  "user.password.changed",
  "user.password.reset",
  "user.status.changed",
] as const;

export const auditActionSchema = z.enum(AUDIT_ACTION_VALUES);
export type AuditAction = z.infer<typeof auditActionSchema>;

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "auth.session.created": "会话创建",
  "auth.session.revoked": "会话撤销",
  "project.deleted": "项目删除",
  "user.created": "用户创建",
  "user.deleted": "用户删除",
  "user.password.changed": "密码修改",
  "user.password.reset": "管理员重置密码",
  "user.status.changed": "用户状态变更",
};

export const auditListQuerySchema = z.object({
  action: z.union([z.literal("all"), auditActionSchema]).catch("all"),
  q: z.string().trim().max(100).catch(""),
  outcome: z.enum(["all", "success", "failure"]).catch("all"),
  sort: z.enum(["created-desc", "created-asc"]).catch("created-desc"),
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  pageSize: z.coerce
    .number()
    .pipe(z.union([z.literal(10), z.literal(20), z.literal(50)]))
    .catch(20),
});

export type AuditListQuery = z.infer<typeof auditListQuerySchema>;

export function parseAuditListQuery(params: Record<string, string | string[] | undefined>): AuditListQuery {
  return auditListQuerySchema.parse(
    Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
}

export function auditListHref(query: AuditListQuery, overrides: Partial<AuditListQuery> = {}) {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.action !== "all") params.set("action", next.action);
  if (next.outcome !== "all") params.set("outcome", next.outcome);
  if (next.sort !== "created-desc") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 20) params.set("pageSize", String(next.pageSize));
  const search = params.toString();
  return `/dashboard/audit${search ? `?${search}` : ""}`;
}
