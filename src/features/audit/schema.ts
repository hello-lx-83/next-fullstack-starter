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
  page: z.coerce.number().int().min(1).catch(1),
});

export type AuditListQuery = z.infer<typeof auditListQuerySchema>;
