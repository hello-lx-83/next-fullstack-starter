"use server";

import { revalidatePath } from "next/cache";

import { revokeSessionSchema } from "@/features/sessions/schema";
import type { ActionResult } from "@/lib/action-result";
import { recordAuditEventFromRequest } from "@/server/audit-request";
import { getCurrentSession } from "@/server/auth/session";
import { revokeOwnedSession } from "@/server/dal/sessions";
import { logRequestError } from "@/server/observability/request-logger";

export async function revokeSessionAction(sessionId: string): Promise<ActionResult> {
  const parsed = revokeSessionSchema.safeParse({ sessionId });
  if (!parsed.success) return { ok: false, message: "会话参数无效" };

  let result: Awaited<ReturnType<typeof revokeOwnedSession>>;
  try {
    result = await revokeOwnedSession(parsed.data.sessionId);
  } catch (error) {
    await logRequestError("session.revoke_failed", error, { targetSessionId: parsed.data.sessionId });
    return { ok: false, message: "撤销会话失败，请稍后重试" };
  }

  if (result === "unauthorized") return { ok: false, message: "登录状态已失效，请重新登录" };
  if (result === "current") return { ok: false, message: "不能在此处撤销当前会话" };
  if (result === "not_found") return { ok: false, message: "会话不存在或已经失效" };

  const currentSession = await getCurrentSession();
  await recordAuditEventFromRequest({
    action: "auth.session.revoked",
    actorUserId: currentSession?.user.id,
    targetId: parsed.data.sessionId,
    targetType: "session",
  });
  revalidatePath("/dashboard/settings/security");
  return { ok: true };
}
