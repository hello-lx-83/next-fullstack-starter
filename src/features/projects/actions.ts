"use server";

import { revalidatePath } from "next/cache";

import { projectIdSchema, projectInputSchema } from "@/features/projects/schema";
import type { ActionResult } from "@/lib/action-result";
import { createProject, toggleOwnedProjectArchive, updateOwnedProject } from "@/server/dal/projects";

function unauthorized(): ActionResult {
  return { ok: false, message: "登录状态已失效，请重新登录" };
}

export async function createProjectAction(
  _previous: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = projectInputSchema.safeParse({ name: formData.get("name"), description: formData.get("description") });
  if (!parsed.success) return { ok: false, message: "请检查表单内容", fieldErrors: parsed.error.flatten().fieldErrors };

  let created: Awaited<ReturnType<typeof createProject>>;
  try {
    created = await createProject(parsed.data);
  } catch {
    return { ok: false, message: "创建项目失败，请稍后重试" };
  }
  if (!created) return unauthorized();
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { ok: true, data: created };
}

export async function updateProjectAction(
  _previous: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const projectId = projectIdSchema.safeParse(formData.get("projectId"));
  const parsed = projectInputSchema.safeParse({ name: formData.get("name"), description: formData.get("description") });
  if (!projectId.success || !parsed.success)
    return {
      ok: false,
      message: "请检查表单内容",
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };

  let updated: Awaited<ReturnType<typeof updateOwnedProject>>;
  try {
    updated = await updateOwnedProject(projectId.data, parsed.data);
  } catch {
    return { ok: false, message: "更新项目失败，请稍后重试" };
  }
  if (!updated) return { ok: false, message: "项目不存在或你没有操作权限" };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { ok: true, data: updated };
}

export async function toggleProjectArchiveAction(projectId: string): Promise<ActionResult> {
  const parsed = projectIdSchema.safeParse(projectId);
  if (!parsed.success) return { ok: false, message: "项目参数无效" };
  let updated: Awaited<ReturnType<typeof toggleOwnedProjectArchive>>;
  try {
    updated = await toggleOwnedProjectArchive(parsed.data);
  } catch {
    return { ok: false, message: "更新项目状态失败，请稍后重试" };
  }
  if (!updated) return { ok: false, message: "项目不存在或你没有操作权限" };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { ok: true };
}
