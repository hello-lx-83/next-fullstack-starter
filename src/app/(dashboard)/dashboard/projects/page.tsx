import { redirect } from "next/navigation";

import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "@/features/projects/project-dialogs";
import { ProjectTable } from "@/features/projects/project-table";
import { parseProjectListQuery, projectListHref } from "@/features/projects/schema";
import { isAdmin } from "@/server/auth/permissions";
import { requireUser } from "@/server/auth/session";
import { listProjects } from "@/server/dal/projects";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseProjectListQuery(await searchParams);
  const [session, result] = await Promise.all([requireUser(), listProjects(query)]);
  const pageCount = Math.max(1, Math.ceil(result.total / query.pageSize));
  if (result.total > 0 && query.page > pageCount) redirect(projectListHref(query, { page: pageCount }));

  return (
    <>
      <PageHeader
        title="项目"
        description="项目增删改查示例；普通用户只能访问自己的项目。"
        actions={
          <ProjectDialog
            mode="create"
            trigger={
              <Button>
                <Plus data-icon="inline-start" />
                新建项目
              </Button>
            }
          />
        }
      />
      <ProjectTable
        projects={result.projects}
        total={result.total}
        query={query}
        showOwner={isAdmin(session.user.role)}
      />
    </>
  );
}
