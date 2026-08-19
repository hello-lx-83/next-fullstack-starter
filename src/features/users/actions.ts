"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createUserSchema, userBannedSchema } from "@/features/users/schema";
import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/server/auth";
import { getCurrentSession } from "@/server/auth/session";
import { setUserBanned } from "@/server/dal/users";

async function getAdminContext(): Promise<{ headers: Headers } | ActionResult> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, message: "登录状态已失效，请重新登录" };
  if (!session.user.role?.split(",").includes("admin")) return { ok: false, message: "你没有管理员权限" };
  return { headers: await headers() };
}

export async function createUserAction(
  _previous: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const context = await getAdminContext();
  if ("ok" in context) return context;
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "请检查表单内容", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const created = await auth.api.createUser({ body: parsed.data, headers: context.headers });
    revalidatePath("/dashboard/users");
    return { ok: true, data: { id: created.user.id } };
  } catch {
    return { ok: false, message: "创建用户失败，请确认邮箱未被使用" };
  }
}

export async function setUserBannedAction(userId: string, banned: boolean): Promise<ActionResult> {
  const parsed = userBannedSchema.safeParse({ userId, banned });
  if (!parsed.success) return { ok: false, message: "用户参数无效" };

  let result: Awaited<ReturnType<typeof setUserBanned>>;
  try {
    result = await setUserBanned(parsed.data);
  } catch {
    return { ok: false, message: "更新用户状态失败，请稍后重试" };
  }
  if (result === "unauthorized") return { ok: false, message: "你没有管理员权限" };
  if (result === "protected") return { ok: false, message: "超级管理员不能被停用" };
  if (result === "not_found") return { ok: false, message: "用户不存在" };
  revalidatePath("/dashboard/users");
  return { ok: true };
}
