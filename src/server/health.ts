import "server-only";

import { sqlite } from "@/server/db";

export type HealthStatus = {
  status: "ok" | "error";
  database: "ok" | "error";
};

export type LivenessStatus = {
  status: "ok";
};

export function getLivenessStatus(): LivenessStatus {
  return { status: "ok" };
}

export function getReadinessStatus(): HealthStatus {
  try {
    const result = sqlite.prepare("SELECT 1 AS value").get() as { value?: number } | undefined;
    return result?.value === 1 ? { status: "ok", database: "ok" } : { status: "error", database: "error" };
  } catch {
    return { status: "error", database: "error" };
  }
}

export function getIntegrityStatus(): HealthStatus {
  try {
    const result = sqlite.pragma("quick_check", { simple: true });
    if (result !== "ok") {
      return { status: "error", database: "error" };
    }

    return { status: "ok", database: "ok" };
  } catch {
    return { status: "error", database: "error" };
  }
}
