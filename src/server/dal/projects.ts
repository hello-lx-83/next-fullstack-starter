import "server-only";

import { and, asc, count, desc, eq, inArray, or, type SQL, sql } from "drizzle-orm";

import type {
  ProjectDto,
  ProjectInput,
  ProjectListQuery,
  ProjectPageDto,
  ProjectSort,
} from "@/features/projects/schema";
import { isAdmin } from "@/server/auth/permissions";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { project, user } from "@/server/db/schema";

const projectSelection = {
  id: project.id,
  ownerId: project.ownerId,
  ownerName: user.name,
  name: project.name,
  description: project.description,
  status: project.status,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
};

const projectOrder: Record<ProjectSort, SQL> = {
  "updated-desc": desc(project.updatedAt),
  "updated-asc": asc(project.updatedAt),
  "name-asc": asc(project.name),
  "name-desc": desc(project.name),
  "created-desc": desc(project.createdAt),
  "created-asc": asc(project.createdAt),
};

function toProjectDto(row: typeof project.$inferSelect & { ownerName: string }, currentUserId: string, admin: boolean) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    canManage: admin || row.ownerId === currentUserId,
  } satisfies ProjectDto;
}

function projectAccess(projectId: string, userId: string, admin: boolean): SQL {
  const identity = eq(project.id, projectId);
  return admin ? identity : (and(identity, eq(project.ownerId, userId)) ?? sql`0`);
}

export async function listProjects(query: ProjectListQuery, database: typeof db = db): Promise<ProjectPageDto> {
  const session = await getCurrentSession();
  if (!session) return { projects: [], total: 0 };

  const admin = isAdmin(session.user.role);
  const conditions: SQL[] = [];
  if (!admin) conditions.push(eq(project.ownerId, session.user.id));
  if (query.status !== "all") conditions.push(eq(project.status, query.status));
  if (query.q) {
    const match = or(
      sql`instr(lower(${project.name}), lower(${query.q})) > 0`,
      sql`instr(lower(${project.description}), lower(${query.q})) > 0`,
    );
    if (match) conditions.push(match);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totals] = await Promise.all([
    database
      .select(projectSelection)
      .from(project)
      .innerJoin(user, eq(project.ownerId, user.id))
      .where(where)
      .orderBy(projectOrder[query.sort], asc(project.id))
      .limit(query.pageSize)
      .offset(offset),
    database
      .select({ total: count(project.id) })
      .from(project)
      .where(where),
  ]);

  return {
    projects: rows.map((row) => toProjectDto(row, session.user.id, admin)),
    total: totals[0]?.total ?? 0,
  };
}

export async function getProject(projectId: string, database: typeof db = db): Promise<ProjectDto | undefined> {
  const session = await getCurrentSession();
  if (!session) return undefined;

  const admin = isAdmin(session.user.role);
  const row = await database
    .select(projectSelection)
    .from(project)
    .innerJoin(user, eq(project.ownerId, user.id))
    .where(projectAccess(projectId, session.user.id, admin))
    .get();
  return row ? toProjectDto(row, session.user.id, admin) : undefined;
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

  const access = projectAccess(projectId, session.user.id, isAdmin(session.user.role));
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

  const access = projectAccess(projectId, session.user.id, isAdmin(session.user.role));
  const current = await database.select({ status: project.status }).from(project).where(access).get();
  if (!current) return undefined;

  return database
    .update(project)
    .set({ status: current.status === "active" ? "archived" : "active", updatedAt: new Date() })
    .where(access)
    .returning({ id: project.id })
    .get();
}

export async function setOwnedProjectsStatus(
  projectIds: string[],
  status: "active" | "archived",
  database: typeof db = db,
) {
  const session = await getCurrentSession();
  if (!session) return undefined;

  const uniqueIds = [...new Set(projectIds)];
  if (uniqueIds.length === 0) return [];
  const identities = inArray(project.id, uniqueIds);
  const access = isAdmin(session.user.role)
    ? identities
    : (and(identities, eq(project.ownerId, session.user.id)) ?? sql`0`);
  return database
    .update(project)
    .set({ status, updatedAt: new Date() })
    .where(access)
    .returning({ id: project.id })
    .all();
}

export async function deleteOwnedArchivedProject(projectId: string, database: typeof db = db) {
  const session = await getCurrentSession();
  if (!session) return undefined;

  const access =
    and(projectAccess(projectId, session.user.id, isAdmin(session.user.role)), eq(project.status, "archived")) ??
    sql`0`;
  return database.delete(project).where(access).returning({ id: project.id }).get();
}
