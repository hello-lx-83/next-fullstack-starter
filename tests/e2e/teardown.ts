import { pidFile } from "./environment";
import { existsSync, readFileSync, rmSync } from "node:fs";

export default function teardown() {
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
