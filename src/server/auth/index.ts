import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { defaultAc, userAc } from "better-auth/plugins/admin/access";

import { getServerEnv } from "@/config/env";
import { db } from "@/server/db";
import { schema } from "@/server/db/schema";

const fixedAdminRole = defaultAc.newRole({
  user: ["create"],
  session: [],
});

export function createAuth(options: { allowSignUp?: boolean } = {}) {
  const env = getServerEnv();

  return betterAuth({
    appName: "Next Fullstack Starter",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !options.allowSignUp,
      minPasswordLength: 8,
    },
    plugins: [
      admin({
        adminRoles: ["admin"],
        defaultRole: "user",
        roles: {
          admin: fixedAdminRole,
          user: userAc,
        },
      }),
    ],
  });
}

export const auth = createAuth();
