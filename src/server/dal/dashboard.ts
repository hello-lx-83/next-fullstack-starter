import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { isAdmin } from "@/server/auth/permissions";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { project } from "@/server/db/schema";

export async function getDashboardOverview() {
  const session = await getCurrentSession();
  if (!session) return { activeProjects: 0, archivedProjects: 0, recentProjects: [] };

  const ownerFilter = isAdmin(session.user.role) ? undefined : eq(project.ownerId, session.user.id);
  const [activeResult, archivedResult, recentProjects] = await Promise.all([
    db
      .select({ value: count() })
      .from(project)
      .where(and(ownerFilter, eq(project.status, "active")))
      .get(),
    db
      .select({ value: count() })
      .from(project)
      .where(and(ownerFilter, eq(project.status, "archived")))
      .get(),
    db
      .select({
        id: project.id,
        name: project.name,
        status: project.status,
        updatedAt: project.updatedAt,
      })
      .from(project)
      .where(ownerFilter)
      .orderBy(desc(project.updatedAt), desc(project.id))
      .limit(5),
  ]);

  return {
    activeProjects: activeResult?.value ?? 0,
    archivedProjects: archivedResult?.value ?? 0,
    recentProjects: recentProjects.map((item) => ({
      ...item,
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}
