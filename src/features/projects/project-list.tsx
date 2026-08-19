import { FolderKanban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectActions } from "@/features/projects/project-dialog";
import type { ProjectDto } from "@/features/projects/schema";

export function ProjectList({ projects, showOwner }: { projects: ProjectDto[]; showOwner: boolean }) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty className="min-h-64 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderKanban />
              </EmptyMedia>
              <EmptyTitle>还没有项目</EmptyTitle>
              <EmptyDescription>创建第一个项目，验证从表单、Server Action 到 SQLite 的完整链路。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>项目</TableHead>
            {showOwner && <TableHead>所有者</TableHead>}
            <TableHead>状态</TableHead>
            <TableHead>更新时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <div className="max-w-md">
                  <p className="font-medium">{project.name}</p>
                  <p className="truncate text-muted-foreground text-xs">{project.description || "暂无描述"}</p>
                </div>
              </TableCell>
              {showOwner && <TableCell>{project.ownerName}</TableCell>}
              <TableCell>
                <Badge variant={project.status === "active" ? "secondary" : "outline"}>
                  {project.status === "active" ? "进行中" : "已归档"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(project.updatedAt))}
              </TableCell>
              <TableCell>{project.canManage && <ProjectActions project={project} />}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
