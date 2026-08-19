import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "请输入姓名").max(80, "姓名不能超过 80 个字符"),
  email: z.email("请输入有效邮箱").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "密码至少需要 8 个字符").max(128, "密码不能超过 128 个字符"),
});

export const userBannedSchema = z.object({
  userId: z.string().trim().min(1, "用户参数无效").max(128, "用户参数无效"),
  banned: z.boolean(),
});
