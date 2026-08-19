import { defineConfig } from "drizzle-kit";

import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const databasePath = resolve(process.env.DATABASE_URL ?? "./data/app.db");
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
