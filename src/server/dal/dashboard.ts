import "server-only";

import { and, count, eq } from "drizzle-orm";

import { isAdmin } from "@/server/auth/permissions";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { project, user } from "@/server/db/schema";

export async function getDashboardStats() {
  const session = await getCurrentSession();
  if (!session) return { activeProjects: 0, archivedProjects: 0, users: null };

  const ownerFilter = isAdmin(session.user.role) ? undefined : eq(project.ownerId, session.user.id);
  const [activeResult, archivedResult, userResult] = await Promise.all([
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
    isAdmin(session.user.role) ? db.select({ value: count() }).from(user).get() : Promise.resolve(undefined),
  ]);

  return {
    activeProjects: activeResult?.value ?? 0,
    archivedProjects: archivedResult?.value ?? 0,
    users: userResult?.value ?? null,
  };
}
