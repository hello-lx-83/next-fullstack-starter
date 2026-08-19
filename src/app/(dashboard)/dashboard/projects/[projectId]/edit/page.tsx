import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ProjectForm } from "@/features/projects/project-form";
import { projectIdSchema } from "@/features/projects/schema";
import { getProject } from "@/server/dal/projects";

export default async function EditProjectPage({ params }: PageProps<"/dashboard/projects/[projectId]/edit">) {
  const { projectId } = await params;
  const parsed = projectIdSchema.safeParse(projectId);
  if (!parsed.success) notFound();
  const project = await getProject(parsed.data);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={`编辑：${project.name}`}
        description="编辑页面与新建页复用字段、Zod Schema 和 Server Action 返回结构。"
      />
      <ProjectForm project={project} />
    </>
  );
}
