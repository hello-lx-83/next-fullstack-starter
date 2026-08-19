import Link from "next/link";
import { redirect } from "next/navigation";

import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/features/projects/project-dialog";
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
        description="搜索、筛选和管理本地 SQLite 中的项目；普通用户只能访问自己的项目。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/projects/new">
                <Plus data-icon="inline-start" />
                完整新建
              </Link>
            </Button>
            <CreateProjectDialog />
          </div>
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
