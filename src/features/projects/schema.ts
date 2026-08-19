import { z } from "zod";

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "请输入项目名称").max(100, "项目名称不能超过 100 个字符"),
  description: z.string().trim().max(500, "项目描述不能超过 500 个字符").optional(),
});

export const projectIdSchema = z.uuid("项目参数无效");

export const projectStatusSchema = z.enum(["active", "archived"]);
export const projectListStatusSchema = z.enum(["all", "active", "archived"]);
export const projectSortSchema = z.enum([
  "updated-desc",
  "updated-asc",
  "name-asc",
  "name-desc",
  "created-desc",
  "created-asc",
]);

export const projectListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: projectListStatusSchema.catch("all"),
  sort: projectSortSchema.catch("updated-desc"),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .pipe(z.union([z.literal(10), z.literal(20), z.literal(50)]))
    .catch(20),
});

export const projectBulkStatusSchema = z.object({
  projectIds: z.array(projectIdSchema).min(1, "请选择至少一个项目").max(100, "一次最多操作 100 个项目"),
  status: projectStatusSchema,
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
export type ProjectSort = z.infer<typeof projectSortSchema>;

export function parseProjectListQuery(searchParams: Record<string, string | string[] | undefined>): ProjectListQuery {
  return projectListQuerySchema.parse({
    q: Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q,
    status: Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status,
    sort: Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort,
    page: Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page,
    pageSize: Array.isArray(searchParams.pageSize) ? searchParams.pageSize[0] : searchParams.pageSize,
  });
}

export function projectListHref(query: ProjectListQuery, overrides: Partial<ProjectListQuery> = {}) {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status !== "all") params.set("status", next.status);
  if (next.sort !== "updated-desc") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 20) params.set("pageSize", String(next.pageSize));
  const search = params.toString();
  return `/dashboard/projects${search ? `?${search}` : ""}`;
}

export interface ProjectDto {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  canManage: boolean;
}

export interface ProjectPageDto {
  projects: ProjectDto[];
  total: number;
}
