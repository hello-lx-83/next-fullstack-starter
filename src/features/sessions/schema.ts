import { z } from "zod";

export const revokeSessionSchema = z.object({
  sessionId: z.string().trim().min(1, "会话参数无效").max(128, "会话参数无效"),
});
