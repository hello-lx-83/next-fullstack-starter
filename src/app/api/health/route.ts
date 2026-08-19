import { getHealthStatus } from "@/server/health";

export async function GET() {
  const health = getHealthStatus();
  return Response.json(health, { status: health.status === "ok" ? 200 : 503 });
}
