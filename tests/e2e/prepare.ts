import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { testDirectory, testEnv } from "./environment";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

async function prepare() {
  const databasePath = testEnv.DATABASE_URL;
  if (existsSync(databasePath)) throw new Error("E2E 数据库已存在，请启动新的测试运行");
  mkdirSync(testDirectory, { recursive: true });
  Object.assign(process.env, testEnv);

  const sqlite = new Database(databasePath);
  try {
    migrate(drizzle(sqlite), { migrationsFolder: resolve("drizzle") });
  } finally {
    sqlite.close();
  }

  const [{ createAuth }, { db }, { user }] = await Promise.all([
    import("../../src/server/auth/index"),
    import("../../src/server/db/index"),
    import("../../src/server/db/schema"),
  ]);
  const auth = createAuth({ allowSignUp: true });
  const created = await auth.api.signUpEmail({
    body: { email: "admin@example.com", name: "测试管理员", password: "AdminPass123!" },
  });
  const { eq } = await import("drizzle-orm");
  await db.update(user).set({ role: "admin" }).where(eq(user.id, created.user.id));
}

prepare().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
