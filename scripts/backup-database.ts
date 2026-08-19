import Database from "better-sqlite3";

import { existsSync, mkdirSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

function loadLocalEnv() {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  } else if (existsSync(".env")) {
    process.loadEnvFile(".env");
  }
}

function assertHealthy(database: Database.Database, label: string) {
  const result = database.pragma("quick_check", { simple: true });
  if (result !== "ok") throw new Error(`${label}未通过 SQLite quick_check`);
}

async function main() {
  loadLocalEnv();
  const databaseUrl = process.env.DATABASE_URL ?? "./data/app.db";
  if (databaseUrl === ":memory:") throw new Error("内存数据库不能备份");

  const sourcePath = resolve(databaseUrl.replace(/^file:/, ""));
  if (!existsSync(sourcePath)) throw new Error(`数据库文件不存在：${sourcePath}`);

  const extension = extname(sourcePath) || ".db";
  const baseName = basename(sourcePath, extname(sourcePath));
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const backupDirectory = join(dirname(sourcePath), "backups");
  const destinationPath = join(backupDirectory, `${baseName}-${timestamp}${extension}`);
  mkdirSync(backupDirectory, { recursive: true });

  const source = new Database(sourcePath, { fileMustExist: true, readonly: true });
  try {
    assertHealthy(source, "源数据库");
    await source.backup(destinationPath);
  } finally {
    source.close();
  }

  const backup = new Database(destinationPath, { fileMustExist: true, readonly: true });
  try {
    assertHealthy(backup, "备份数据库");
  } finally {
    backup.close();
  }

  console.info(`数据库备份已创建：${destinationPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "数据库备份失败");
  process.exitCode = 1;
});
