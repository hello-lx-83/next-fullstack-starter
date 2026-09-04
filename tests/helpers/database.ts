import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { createDatabase } from "@/server/db/factory";

import { resolve } from "node:path";

export function createTestDatabase() {
  const database = createDatabase(":memory:");
  migrate(database.db, { migrationsFolder: resolve("drizzle") });
  return database;
}
