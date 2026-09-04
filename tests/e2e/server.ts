import { pidFile, testEnv } from "./environment";
import { type ChildProcess, spawn } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let activeChild: ChildProcess | undefined;
let stopping = false;

function stop() {
  stopping = true;
  activeChild?.kill("SIGTERM");
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);

function run(args: string[], recordPid = false): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      env: { ...process.env, ...testEnv },
      stdio: "inherit",
    });
    activeChild = child;
    if (recordPid && child.pid) writeFileSync(pidFile, String(child.pid));
    child.once("error", reject);
    child.once("close", (code) => {
      activeChild = undefined;
      resolve(code ?? 1);
    });
  });
}

async function main() {
  const prepared = await run(["--import", "tsx", "tests/e2e/prepare.ts"]);
  if (prepared !== 0 || stopping) return prepared || 1;

  const nextCli = require.resolve("next/dist/bin/next");
  const built = await run([nextCli, "build"]);
  if (built !== 0 || stopping) return built || 1;

  try {
    return await run([nextCli, "start", "--port", "3100"], true);
  } finally {
    rmSync(pidFile, { force: true });
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
