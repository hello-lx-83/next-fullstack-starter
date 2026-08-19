import "server-only";

import { and, desc, eq, ne } from "drizzle-orm";

import { getCurrentSession, requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { session as authSession } from "@/server/db/schema";

export interface SessionDto {
  id: string;
  device: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  current: boolean;
}

function describeUserAgent(value: string | null): string {
  if (!value) return "未知设备";

  let browser = "浏览器";
  if (value.includes("Edg/")) browser = "Edge";
  else if (value.includes("Firefox/")) browser = "Firefox";
  else if (value.includes("Chrome/")) browser = "Chrome";
  else if (value.includes("Safari/")) browser = "Safari";

  let system = "未知系统";
  if (value.includes("Windows")) system = "Windows";
  else if (value.includes("Android")) system = "Android";
  else if (value.includes("iPhone") || value.includes("iPad")) system = "iOS";
  else if (value.includes("Macintosh")) system = "macOS";
  else if (value.includes("Linux")) system = "Linux";

  return `${browser} · ${system}`;
}

export async function listCurrentUserSessions(): Promise<SessionDto[]> {
  const currentSession = await requireUser();
  const rows = await db
    .select({
      id: authSession.id,
      userAgent: authSession.userAgent,
      createdAt: authSession.createdAt,
      updatedAt: authSession.updatedAt,
      expiresAt: authSession.expiresAt,
    })
    .from(authSession)
    .where(eq(authSession.userId, currentSession.user.id))
    .orderBy(desc(authSession.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    device: describeUserAgent(row.userAgent),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    current: row.id === currentSession.session.id,
  }));
}

export async function revokeOwnedSession(
  sessionId: string,
): Promise<"revoked" | "unauthorized" | "current" | "not_found"> {
  const currentSession = await getCurrentSession();
  if (!currentSession) return "unauthorized";
  if (sessionId === currentSession.session.id) return "current";

  const [deleted] = await db
    .delete(authSession)
    .where(
      and(
        eq(authSession.id, sessionId),
        eq(authSession.userId, currentSession.user.id),
        ne(authSession.id, currentSession.session.id),
      ),
    )
    .returning({ id: authSession.id });

  return deleted ? "revoked" : "not_found";
}
