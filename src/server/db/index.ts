import { getDatabaseEnv } from "@/config/env";

import { createDatabase } from "./factory";

const globalDatabase = globalThis as typeof globalThis & {
  nextFullstackDatabase?: ReturnType<typeof createDatabase>;
};

const database = globalDatabase.nextFullstackDatabase ?? createDatabase(getDatabaseEnv().DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalDatabase.nextFullstackDatabase = database;
}

export const db = database.db;
export const sqlite = database.sqlite;
