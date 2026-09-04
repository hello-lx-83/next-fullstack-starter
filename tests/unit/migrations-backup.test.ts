import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, describe, expect, it } from "vitest";

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const directories: string[] = [];
const connections: Database.Database[] = [];

function openDatabase(path: string) {
  const database = new Database(path);
  connections.push(database);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  return database;
}

afterEach(() => {
  for (const connection of connections.splice(0)) connection.close();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("迁移与备份恢复", () => {
  it("全部迁移可初始化空库，重复执行保留现有数据", () => {
    const database = openDatabase(":memory:");
    const db = drizzle(database);
    const options = { migrationsFolder: resolve("drizzle") };
    migrate(db, options);
    expect(database.prepare("SELECT COUNT(*) AS count FROM user").get()).toEqual({ count: 0 });
    expect(database.prepare("SELECT COUNT(*) AS count FROM project").get()).toEqual({ count: 0 });
    database.exec("INSERT INTO user (id, name, email) VALUES ('migration-user', '迁移测试', 'migration@example.com')");
    migrate(db, options);
    expect(database.prepare("SELECT id FROM user").all()).toEqual([{ id: "migration-user" }]);
    expect(database.pragma("foreign_key_check")).toEqual([]);
  });

  it("备份脚本保留已提交的 WAL 数据，备份可独立打开恢复", () => {
    const directory = mkdtempSync(join(tmpdir(), "starter-backup-"));
    directories.push(directory);
    const sourcePath = join(directory, "source.db");
    const backupDirectory = join(directory, "backups");
    const source = openDatabase(sourcePath);
    source.exec("CREATE TABLE recovery_probe (value TEXT NOT NULL)");
    source.prepare("INSERT INTO recovery_probe VALUES (?)").run("需要恢复的数据");

    const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/backup-database.ts"], {
      env: { ...process.env, DATABASE_URL: sourcePath, BACKUP_DIRECTORY: backupDirectory },
      encoding: "utf8",
      timeout: 10_000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);

    const backups = readdirSync(backupDirectory).filter((file) => file.endsWith(".db"));
    expect(backups).toHaveLength(1);
    const restoredPath = join(directory, "restored.db");
    copyFileSync(join(backupDirectory, backups[0]), restoredPath);
    const recovered = openDatabase(restoredPath);
    expect(recovered.pragma("quick_check", { simple: true })).toBe("ok");
    expect(recovered.prepare("SELECT value FROM recovery_probe").all()).toEqual([{ value: "需要恢复的数据" }]);
  });
});
