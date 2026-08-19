import Link from "next/link";

import { Archive, FolderKanban, Plus, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin } from "@/server/auth/permissions";
import { requireUser } from "@/server/auth/session";
import { getDashboardStats } from "@/server/dal/dashboard";

export default async function DashboardPage() {
  const [session, stats] = await Promise.all([requireUser(), getDashboardStats()]);
  const cards = [
    { title: "进行中的项目", value: stats.activeProjects, description: "当前可操作的项目", icon: FolderKanban },
    { title: "已归档项目", value: stats.archivedProjects, description: "可随时恢复", icon: Archive },
    ...(stats.users === null
      ? []
      : [{ title: "用户数量", value: stats.users, description: "已创建的本地账号", icon: Users }]),
  ];

  return (
    <>
      <PageHeader
        title={`你好，${session.user.name}`}
        description="这里展示来自 SQLite 的真实数据，不包含任何演示记录。"
        actions={
          <Button asChild>
            <Link href="/dashboard/projects">
              <Plus />
              管理项目
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
              <item.icon className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-3xl tabular-nums">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>模板已就绪</CardTitle>
          <CardDescription>认证、权限、Server Actions、数据访问层和数据库迁移均已连接。</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {isAdmin(session.user.role)
            ? "你当前是管理员，可以管理所有项目和用户。"
            : "你当前是普通用户，只能管理自己创建的项目。"}
        </CardContent>
      </Card>
    </>
  );
}
