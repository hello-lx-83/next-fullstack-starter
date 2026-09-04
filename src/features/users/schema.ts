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

export const deleteUserSchema = userBannedSchema.pick({ userId: true });

export const resetUserPasswordSchema = z
  .object({
    userId: z.string().trim().min(1, "用户参数无效").max(128, "用户参数无效"),
    newPassword: z.string().min(8, "密码至少需要 8 个字符").max(128, "密码不能超过 128 个字符"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const userListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  role: z.enum(["all", "admin", "user"]).catch("all"),
  status: z.enum(["all", "active", "banned"]).catch("all"),
  sort: z.enum(["created-desc", "created-asc", "name-asc", "name-desc"]).catch("created-desc"),
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  pageSize: z.coerce
    .number()
    .pipe(z.union([z.literal(10), z.literal(20), z.literal(50)]))
    .catch(20),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;

export function parseUserListQuery(params: Record<string, string | string[] | undefined>): UserListQuery {
  return userListQuerySchema.parse(
    Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
}

export function userListHref(query: UserListQuery, overrides: Partial<UserListQuery> = {}) {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.role !== "all") params.set("role", next.role);
  if (next.status !== "all") params.set("status", next.status);
  if (next.sort !== "created-desc") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 20) params.set("pageSize", String(next.pageSize));
  const search = params.toString();
  return `/dashboard/users${search ? `?${search}` : ""}`;
}
