import { getLivenessStatus } from "@/server/health";

export async function GET() {
  return Response.json(getLivenessStatus());
}
