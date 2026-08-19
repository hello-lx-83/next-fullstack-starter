import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

export default function teardown() {
  const pidFile = resolve("data/e2e-server.pid");
  if (!existsSync(pidFile)) return;

  const pid = Number(readFileSync(pidFile, "utf8"));
  if (Number.isInteger(pid) && pid > 0) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }
  }
  rmSync(pidFile, { force: true });
}
