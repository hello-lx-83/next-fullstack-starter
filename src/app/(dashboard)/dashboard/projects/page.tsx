import { PageHeader } from "@/components/shared/page-header";
import { CreateProjectDialog } from "@/features/projects/project-dialog";
import { ProjectList } from "@/features/projects/project-list";
import { isAdmin } from "@/server/auth/permissions";
import { requireUser } from "@/server/auth/session";
import { listProjects } from "@/server/dal/projects";

export default async function ProjectsPage() {
  const [session, projects] = await Promise.all([requireUser(), listProjects()]);
  return (
    <>
      <PageHeader
        title="项目"
        description="项目数据保存在本地 SQLite；普通用户只能管理自己的项目。"
        actions={<CreateProjectDialog />}
      />
      <ProjectList projects={projects} showOwner={isAdmin(session.user.role)} />
    </>
  );
}
