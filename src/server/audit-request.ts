import "server-only";

import { type AuditEventInput, recordAuditEvent } from "@/server/audit";
import { getRequestContext } from "@/server/observability/request-context";

export async function recordAuditEventFromRequest(
  input: Omit<AuditEventInput, "requestId" | "userAgent">,
): Promise<boolean> {
  const context = await getRequestContext();
  return recordAuditEvent({ ...input, ...context });
}
