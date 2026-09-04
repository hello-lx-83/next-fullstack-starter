import { defineConfig } from "drizzle-kit";

import { loadLocalEnv } from "./scripts/lib/load-env";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL ?? "./data/app.db";
if (!databaseUrl.trim() || databaseUrl === ":memory:") {
  throw new Error("数据库迁移需要持久化的 SQLite 文件路径");
}
const databasePath = resolve(databaseUrl.replace(/^file:/, ""));
mkdirSync(dirname(databasePath), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databasePath,
  },
  strict: true,
  verbose: true,
});
