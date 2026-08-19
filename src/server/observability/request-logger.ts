import "server-only";

import { logger, toErrorFields } from "@/server/observability/logger";
import { getRequestContext } from "@/server/observability/request-context";

export async function logRequestError(event: string, error: unknown, fields: Readonly<Record<string, unknown>> = {}) {
  const context = await getRequestContext();
  logger.error(event, { ...context, ...fields, ...toErrorFields(error) });
}
