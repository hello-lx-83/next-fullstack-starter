import "server-only";
import { auth } from "@/server/auth";

const publicEndpoints = new Set([
  "GET /api/auth/get-session",
  "GET /api/auth/ok",
  "POST /api/auth/sign-in/email",
  "POST /api/auth/sign-out",
]);

export function handleAuthRequest(request: Request): Promise<Response> | Response {
  if (!publicEndpoints.has(`${request.method} ${new URL(request.url).pathname}`)) {
    return Response.json({ message: "此认证接口未开放" }, { status: 403 });
  }
  return auth.handler(request);
}
