"use server";

import { revalidatePath } from "next/cache";

import { projectBulkStatusSchema, projectIdSchema, projectInputSchema } from "@/features/projects/schema";
import type { ActionResult } from "@/lib/action-result";
import { recordAuditEventFromRequest } from "@/server/audit-request";
import { getCurrentSession } from "@/server/auth/session";
import {
  createProject,
  deleteOwnedArchivedProject,
  setOwnedProjectsStatus,
  toggleOwnedProjectArchive,
  updateOwnedProject,
} from "@/server/dal/projects";
import { logRequestError } from "@/server/observability/request-logger";

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
  } catch (error) {
    await logRequestError("project.create_failed", error);
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
  } catch (error) {
    await logRequestError("project.update_failed", error, { projectId: projectId.data });
    return { ok: false, message: "更新项目失败，请稍后重试" };
  }
  if (!updated) return { ok: false, message: "项目不存在或你没有操作权限" };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId.data}`);
  return { ok: true, data: updated };
}

export async function toggleProjectArchiveAction(projectId: string): Promise<ActionResult> {
  const parsed = projectIdSchema.safeParse(projectId);
  if (!parsed.success) return { ok: false, message: "项目参数无效" };
  let updated: Awaited<ReturnType<typeof toggleOwnedProjectArchive>>;
  try {
    updated = await toggleOwnedProjectArchive(parsed.data);
  } catch (error) {
    await logRequestError("project.status_change_failed", error, { projectId: parsed.data });
    return { ok: false, message: "更新项目状态失败，请稍后重试" };
  }
  if (!updated) return { ok: false, message: "项目不存在或你没有操作权限" };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${parsed.data}`);
  return { ok: true };
}

export async function setProjectsStatusAction(
  projectIds: string[],
  status: "active" | "archived",
): Promise<ActionResult<{ updated: number }>> {
  const parsed = projectBulkStatusSchema.safeParse({ projectIds, status });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "项目参数无效" };

  let updated: Awaited<ReturnType<typeof setOwnedProjectsStatus>>;
  try {
    updated = await setOwnedProjectsStatus(parsed.data.projectIds, parsed.data.status);
  } catch (error) {
    await logRequestError("project.bulk_status_change_failed", error, { projectCount: parsed.data.projectIds.length });
    return { ok: false, message: "批量更新项目失败，请稍后重试" };
  }
  if (!updated) return unauthorized();
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { ok: true, data: { updated: updated.length } };
}

export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
  const parsed = projectIdSchema.safeParse(projectId);
  if (!parsed.success) return { ok: false, message: "项目参数无效" };

  let deleted: Awaited<ReturnType<typeof deleteOwnedArchivedProject>>;
  try {
    deleted = await deleteOwnedArchivedProject(parsed.data);
  } catch (error) {
    await logRequestError("project.delete_failed", error, { projectId: parsed.data });
    return { ok: false, message: "删除项目失败，请稍后重试" };
  }
  if (!deleted) return { ok: false, message: "只有已归档且有权限的项目可以永久删除" };
  const session = await getCurrentSession();
  if (session) {
    await recordAuditEventFromRequest({
      action: "project.deleted",
      actorUserId: session.user.id,
      targetId: parsed.data,
      targetType: "project",
    });
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { ok: true };
}
