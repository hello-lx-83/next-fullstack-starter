import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { getServerEnv } from "@/config/env";

import { schema } from "./schema";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function createDatabase(databaseUrl: string) {
  const databasePath = databaseUrl === ":memory:" ? databaseUrl : resolve(databaseUrl.replace(/^file:/, ""));
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }
  const sqlite = new Database(databasePath);
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");

  return {
    db: drizzle(sqlite, { schema }),
    sqlite,
  };
}

const globalDatabase = globalThis as typeof globalThis & {
  nextFullstackDatabase?: ReturnType<typeof createDatabase>;
};

const database = globalDatabase.nextFullstackDatabase ?? createDatabase(getServerEnv().DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalDatabase.nextFullstackDatabase = database;
}

export const db = database.db;
export const sqlite = database.sqlite;
