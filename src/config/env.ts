import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).default("./data/app.db"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3009"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET 至少需要 32 个字符"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  return serverEnvSchema.parse(source);
}
