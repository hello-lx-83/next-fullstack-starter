"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { passwordSchema, profileSchema } from "@/features/profile/schema";
import type { ActionResult } from "@/lib/action-result";
import { recordAuditEventFromRequest } from "@/server/audit-request";
import { auth } from "@/server/auth";
import { getCurrentSession } from "@/server/auth/session";
import { logRequestError } from "@/server/observability/request-logger";

type ProfileActionResult = ActionResult<{ message: string }>;

export async function updateProfileAction(
  _previous: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, message: "登录状态已失效，请重新登录" };
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { ok: false, message: "请检查表单内容", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await auth.api.updateUser({ body: parsed.data, headers: await headers() });
    revalidatePath("/dashboard/settings/profile");
    return { ok: true, data: { message: "个人资料已保存" } };
  } catch (error) {
    await logRequestError("profile.update_failed", error, { actorUserId: session.user.id });
    return { ok: false, message: "保存个人资料失败，请稍后重试" };
  }
}

export async function changePasswordAction(
  _previous: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, message: "登录状态已失效，请重新登录" };
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "请检查表单内容", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
    await recordAuditEventFromRequest({
      action: "user.password.changed",
      actorUserId: session.user.id,
      targetId: session.user.id,
      targetType: "user",
    });
    return { ok: true, data: { message: "密码已修改，其他设备上的会话已退出" } };
  } catch (error) {
    await logRequestError("profile.password_change_failed", error, { actorUserId: session.user.id });
    return { ok: false, message: "当前密码不正确，修改失败" };
  }
}
