import { getReadinessStatus } from "@/server/health";

export async function GET() {
  const health = getReadinessStatus();
  return Response.json(health, { status: health.status === "ok" ? 200 : 503 });
}
