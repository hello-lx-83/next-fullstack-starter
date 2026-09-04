"use server";

import { revalidatePath } from "next/cache";

import { createUserSchema, deleteUserSchema, resetUserPasswordSchema, userBannedSchema } from "@/features/users/schema";
import type { ActionResult } from "@/lib/action-result";
import { createUser, deleteUser, resetUserPassword, setUserBanned } from "@/server/dal/users";
import { logRequestError } from "@/server/observability/request-logger";

export async function createUserAction(
  _previous: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "请检查表单内容", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const created = await createUser(parsed.data);
    if (!created) return { ok: false, message: "你没有管理员权限" };
    revalidatePath("/dashboard/users");
    return { ok: true, data: created };
  } catch (error) {
    await logRequestError("user.create_failed", error);
    return { ok: false, message: "创建用户失败，请确认邮箱未被使用" };
  }
}

export async function setUserBannedAction(userId: string, banned: boolean): Promise<ActionResult> {
  const parsed = userBannedSchema.safeParse({ userId, banned });
  if (!parsed.success) return { ok: false, message: "用户参数无效" };

  let result: Awaited<ReturnType<typeof setUserBanned>>;
  try {
    result = await setUserBanned(parsed.data);
  } catch (error) {
    await logRequestError("user.status_change_failed", error, { targetUserId: parsed.data.userId });
    return { ok: false, message: "更新用户状态失败，请稍后重试" };
  }
  if (result === "unauthorized") return { ok: false, message: "你没有管理员权限" };
  if (result === "protected") return { ok: false, message: "超级管理员不能被停用" };
  if (result === "not_found") return { ok: false, message: "用户不存在" };
  revalidatePath("/dashboard/users");
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const parsed = deleteUserSchema.safeParse({ userId });
  if (!parsed.success) return { ok: false, message: "用户参数无效" };

  let result: Awaited<ReturnType<typeof deleteUser>>;
  try {
    result = await deleteUser(parsed.data);
  } catch (error) {
    await logRequestError("user.delete_failed", error, { targetUserId: parsed.data.userId });
    return { ok: false, message: "删除用户失败，请稍后重试" };
  }
  if (result === "unauthorized") return { ok: false, message: "你没有管理员权限" };
  if (result === "protected") return { ok: false, message: "管理员账号不能被删除" };
  if (result === "not_found") return { ok: false, message: "用户不存在" };
  revalidatePath("/dashboard/users");
  return { ok: true };
}

export async function resetUserPasswordAction(
  userId: string,
  _previous: ActionResult<{ reset: true }>,
  formData: FormData,
): Promise<ActionResult<{ reset: true }>> {
  const parsed = resetUserPasswordSchema.safeParse({ userId, ...Object.fromEntries(formData) });
  if (!parsed.success) {
    return { ok: false, message: "请检查表单内容", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await resetUserPassword(parsed.data);
    if (result === "unauthorized") return { ok: false, message: "你没有管理员权限" };
    if (result === "protected") return { ok: false, message: "管理员密码只能由本人修改" };
    if (result === "not_found") return { ok: false, message: "用户不存在" };
  } catch (error) {
    await logRequestError("user.password_reset_failed", error, { targetUserId: parsed.data.userId });
    return { ok: false, message: "重置密码失败，请稍后重试" };
  }

  revalidatePath("/dashboard/users");
  return { ok: true, data: { reset: true } };
}
