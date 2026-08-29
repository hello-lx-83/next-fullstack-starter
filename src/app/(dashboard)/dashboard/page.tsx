import Link from "next/link";

import { Archive, ArrowRight, FolderKanban } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/server/auth/session";
import { getDashboardOverview } from "@/server/dal/dashboard";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function DashboardPage() {
  const [session, overview] = await Promise.all([requireUser(), getDashboardOverview()]);

  return (
    <>
      <PageHeader
        title={`你好，${session.user.name}`}
        description="从最近的工作继续，或进入项目列表开始新的内容。"
        actions={
          <Button asChild>
            <Link href="/dashboard/projects">
              查看项目
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>工作概览</CardTitle>
          <CardDescription>项目状态的简要汇总。</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            <div className="min-w-40">
              <dt className="flex items-center gap-3 text-muted-foreground text-sm">
                <FolderKanban className="size-5" aria-hidden="true" />
                进行中
              </dt>
              <dd className="pl-8 font-semibold text-2xl tabular-nums">{overview.activeProjects}</dd>
            </div>
            <div className="min-w-40">
              <dt className="flex items-center gap-3 text-muted-foreground text-sm">
                <Archive className="size-5" aria-hidden="true" />
                已归档
              </dt>
              <dd className="pl-8 font-semibold text-2xl tabular-nums">{overview.archivedProjects}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>最近项目</CardTitle>
            <CardDescription>按最近更新时间排列。</CardDescription>
          </div>
          {overview.recentProjects.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/projects">
                查看全部
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {overview.recentProjects.length > 0 ? (
            <ul className="flex flex-col">
              {overview.recentProjects.map((item, index) => (
                <li key={item.id}>
                  {index > 0 ? <Separator /> : null}
                  <Link
                    href={`/dashboard/projects?q=${encodeURIComponent(item.name)}`}
                    className="flex items-center justify-between gap-4 py-3 outline-none transition-colors hover:text-primary focus-visible:text-primary"
                  >
                    <span className="min-w-0 truncate font-medium">{item.name}</span>
                    <span className="flex shrink-0 items-center gap-3">
                      <Badge variant={item.status === "active" ? "secondary" : "outline"}>
                        {item.status === "active" ? "进行中" : "已归档"}
                      </Badge>
                      <time className="hidden text-muted-foreground text-xs sm:inline" dateTime={item.updatedAt}>
                        {dateFormatter.format(new Date(item.updatedAt))}
                      </time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="min-h-56 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanban />
                </EmptyMedia>
                <EmptyTitle>还没有项目</EmptyTitle>
                <EmptyDescription>进入项目列表创建第一条真实业务数据。</EmptyDescription>
              </EmptyHeader>
              <Button asChild>
                <Link href="/dashboard/projects">进入项目列表</Link>
              </Button>
            </Empty>
          )}
        </CardContent>
      </Card>
    </>
  );
}
