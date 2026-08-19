import "server-only";

import { sqlite } from "@/server/db";

export type HealthStatus = {
  status: "ok" | "error";
  database: "ok" | "error";
};

export function getHealthStatus(): HealthStatus {
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
