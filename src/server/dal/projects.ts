import "server-only";

import { and, desc, eq } from "drizzle-orm";

import type { ProjectDto, ProjectInput } from "@/features/projects/schema";
import { isAdmin } from "@/server/auth/permissions";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { project, user } from "@/server/db/schema";

export async function listProjects(): Promise<ProjectDto[]> {
  const session = await getCurrentSession();
  if (!session) return [];

  const rows = await db
    .select({
      id: project.id,
      ownerId: project.ownerId,
      ownerName: user.name,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
    .from(project)
    .innerJoin(user, eq(project.ownerId, user.id))
    .where(isAdmin(session.user.role) ? undefined : eq(project.ownerId, session.user.id))
    .orderBy(desc(project.updatedAt));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    canManage: isAdmin(session.user.role) || row.ownerId === session.user.id,
  }));
}

export async function createProject(input: ProjectInput, database: typeof db = db) {
  const session = await getCurrentSession();
  if (!session) return undefined;

  return database
    .insert(project)
    .values({ ownerId: session.user.id, name: input.name, description: input.description || null })
    .returning({ id: project.id })
    .get();
}

export async function updateOwnedProject(projectId: string, input: ProjectInput, database: typeof db = db) {
  const session = await getCurrentSession();
  if (!session) return undefined;

  const access = isAdmin(session.user.role)
    ? eq(project.id, projectId)
    : and(eq(project.id, projectId), eq(project.ownerId, session.user.id));
  return database
    .update(project)
    .set({ name: input.name, description: input.description || null, updatedAt: new Date() })
    .where(access)
    .returning({ id: project.id })
    .get();
}

export async function toggleOwnedProjectArchive(projectId: string, database: typeof db = db) {
  const session = await getCurrentSession();
  if (!session) return undefined;

  const access = isAdmin(session.user.role)
    ? eq(project.id, projectId)
    : and(eq(project.id, projectId), eq(project.ownerId, session.user.id));
  const current = await database.select({ status: project.status }).from(project).where(access).get();
  if (!current) return undefined;

  return database
    .update(project)
    .set({ status: current.status === "active" ? "archived" : "active", updatedAt: new Date() })
    .where(access)
    .returning({ id: project.id })
    .get();
}
