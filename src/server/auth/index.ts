import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { defaultAc, userAc } from "better-auth/plugins/admin/access";

import { APP_CONFIG } from "@/config/app-config";
import { getServerEnv } from "@/config/env";
import { recordAuditEvent } from "@/server/audit";
import { db } from "@/server/db";
import { schema } from "@/server/db/schema";
import { logger } from "@/server/observability/logger";

const fixedAdminRole = defaultAc.newRole({
  user: ["create", "set-password"],
  session: [],
});

export function createAuth(options: { allowSignUp?: boolean } = {}) {
  const env = getServerEnv();

  return betterAuth({
    appName: APP_CONFIG.name,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/change-password": { window: 60, max: 5 },
        "/sign-in/email": { window: 60, max: 5 },
      },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: !options.allowSignUp,
      minPasswordLength: 8,
    },
    advanced: {
      disableCSRFCheck: false,
      disableOriginCheck: false,
      ipAddress: { disableIpTracking: false },
    },
    logger: {
      level: "warn",
      log(level, message, ...details) {
        logger[level]("auth.library", { details, message });
      },
    },
    databaseHooks: {
      session: {
        create: {
          after: async (session, context) => {
            await recordAuditEvent({
              action: "auth.session.created",
              actorUserId: session.userId,
              requestId: context?.request?.headers.get("x-request-id"),
              targetId: session.userId,
              targetType: "user",
              userAgent: context?.request?.headers.get("user-agent"),
            });
          },
        },
      },
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
