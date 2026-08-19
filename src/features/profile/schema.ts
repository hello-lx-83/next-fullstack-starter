import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "请输入姓名").max(80, "姓名不能超过 80 个字符"),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z.string().min(8, "新密码至少需要 8 个字符").max(128),
    confirmPassword: z.string().min(1, "请再次输入新密码"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });
