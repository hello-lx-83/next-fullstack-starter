import "server-only";

import { headers } from "next/headers";

export interface RequestContext {
  requestId: string | null;
  userAgent: string | null;
}

export async function getRequestContext(): Promise<RequestContext> {
  const requestHeaders = await headers();
  return {
    requestId: requestHeaders.get("x-request-id"),
    userAgent: requestHeaders.get("user-agent"),
  };
}
