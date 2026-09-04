"use server";

import { revalidatePath } from "next/cache";

import { passwordSchema, profileSchema } from "@/features/profile/schema";
import type { ActionResult } from "@/lib/action-result";
import { getCurrentSession } from "@/server/auth/session";
import { changePassword, updateProfile } from "@/server/dal/profile";
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
    if (!(await updateProfile(parsed.data))) return { ok: false, message: "登录状态已失效，请重新登录" };
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
    const result = await changePassword(parsed.data);
    if (result === "unauthorized") return { ok: false, message: "登录状态已失效，请重新登录" };
    if (result === "invalid_password") return { ok: false, message: "当前密码不正确，修改失败" };
    return { ok: true, data: { message: "密码已修改，其他设备上的会话已退出" } };
  } catch (error) {
    await logRequestError("profile.password_change_failed", error, { actorUserId: session.user.id });
    return { ok: false, message: "修改密码失败，请稍后重试" };
  }
}
