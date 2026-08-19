import { eq } from "drizzle-orm";
import { z } from "zod";

import { existsSync } from "node:fs";

function loadLocalEnv() {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  } else if (existsSync(".env")) {
    process.loadEnvFile(".env");
  }
}

const adminEnvSchema = z.object({
  ADMIN_NAME: z.string().trim().min(1),
  ADMIN_EMAIL: z.email().transform((value) => value.toLowerCase()),
  ADMIN_PASSWORD: z.string().min(8),
});

async function main() {
  loadLocalEnv();
  const adminEnv = adminEnvSchema.parse(process.env);
  const [{ createAuth }, { enforceSingleAdmin }, { db }, { user }] = await Promise.all([
    import("../src/server/auth/index"),
    import("../src/server/auth/single-admin"),
    import("../src/server/db/index"),
    import("../src/server/db/schema"),
  ]);

  let adminUser = await db.select({ id: user.id }).from(user).where(eq(user.email, adminEnv.ADMIN_EMAIL)).get();

  if (!adminUser) {
    const bootstrapAuth = createAuth({ allowSignUp: true });
    const created = await bootstrapAuth.api.signUpEmail({
      body: {
        email: adminEnv.ADMIN_EMAIL,
        name: adminEnv.ADMIN_NAME,
        password: adminEnv.ADMIN_PASSWORD,
      },
    });
    adminUser = { id: created.user.id };
  }

  enforceSingleAdmin(db, { id: adminUser.id, name: adminEnv.ADMIN_NAME });
  console.info(`管理员账号已就绪：${adminEnv.ADMIN_EMAIL}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "初始化管理员失败");
  process.exitCode = 1;
});
