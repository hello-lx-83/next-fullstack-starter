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
