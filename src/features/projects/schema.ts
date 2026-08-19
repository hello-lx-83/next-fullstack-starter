import { z } from "zod";

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "请输入项目名称").max(100, "项目名称不能超过 100 个字符"),
  description: z.string().trim().max(500, "项目描述不能超过 500 个字符").optional(),
});

export const projectIdSchema = z.uuid("项目参数无效");

export type ProjectInput = z.infer<typeof projectInputSchema>;

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
