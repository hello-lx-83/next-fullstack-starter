import { spawn } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const pidFile = resolve("data/e2e-server.pid");

function run(command: string, args: string[], shell = false) {
  return spawn(command, args, {
    env: process.env,
    shell,
    stdio: "inherit",
  });
}

const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) throw new Error("无法定位当前 pnpm CLI");
const build = run(process.execPath, [pnpmCli, "build"]);
build.once("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);

  const server = run(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3100"]);
  if (!server.pid) process.exit(1);
  writeFileSync(pidFile, String(server.pid));

  const stop = () => {
    if (!server.killed) server.kill("SIGTERM");
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  server.once("exit", (serverCode) => {
    rmSync(pidFile, { force: true });
    process.exit(serverCode ?? 0);
  });
});
