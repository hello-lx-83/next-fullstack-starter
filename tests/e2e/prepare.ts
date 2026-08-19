import Database from "better-sqlite3";

import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

async function prepare() {
  const databasePath = resolve("data/e2e.db");
  if (existsSync(databasePath)) rmSync(databasePath);
  process.env.DATABASE_URL = databasePath;
  process.env.BETTER_AUTH_URL = "http://localhost:3100";
  process.env.BETTER_AUTH_SECRET = "e2e-test-secret-at-least-32-characters-long";

  const sqlite = new Database(databasePath);
  const migration = readFileSync(resolve("drizzle/0000_abandoned_fat_cobra.sql"), "utf8").replaceAll(
    "--> statement-breakpoint",
    "",
  );
  sqlite.exec(migration);
  sqlite.close();

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
