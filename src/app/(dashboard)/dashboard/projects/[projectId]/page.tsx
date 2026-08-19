import { ViewTransition } from "react";

import { notFound } from "next/navigation";

import { CalendarDays, UserRound } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectDetailActions } from "@/features/projects/project-dialog";
import { projectIdSchema } from "@/features/projects/schema";
import { getProject } from "@/server/dal/projects";

export default async function ProjectDetailPage({ params }: PageProps<"/dashboard/projects/[projectId]">) {
  const { projectId } = await params;
  const parsed = projectIdSchema.safeParse(projectId);
  if (!parsed.success) notFound();
  const project = await getProject(parsed.data);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={
          <ViewTransition name={`project-title-${project.id}`} share="project-title" default="none">
            {project.name}
          </ViewTransition>
        }
        description="查看项目当前信息，并从这里进入编辑、归档或删除流程。"
        actions={<ProjectDetailActions project={project} />}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>项目概览</CardTitle>
            <CardDescription>项目的名称、描述和当前生命周期状态。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={project.status === "active" ? "secondary" : "outline"}>
                {project.status === "active" ? "进行中" : "已归档"}
              </Badge>
              <span className="text-muted-foreground text-sm">项目 ID：{project.id}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6">{project.description ?? "暂无项目描述。"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>记录信息</CardTitle>
            <CardDescription>所有者和本地数据库时间戳。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="font-medium">所有者</p>
                <p className="text-muted-foreground">{project.ownerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <p>
                  创建：{new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date(project.createdAt))}
                </p>
                <p>
                  更新：{new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date(project.updatedAt))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
