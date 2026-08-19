import { Check, Minus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SettingsPageHeader } from "@/features/settings/settings-page-header";
import { requireAdmin } from "@/server/auth/session";

const permissions = [
  { name: "查看和管理自己的项目", admin: true, user: true },
  { name: "查看和管理所有项目", admin: true, user: false },
  { name: "创建和停用用户", admin: true, user: false },
  { name: "修改自己的资料和密码", admin: true, user: true },
];

function Permission({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <Check className="size-4 text-foreground" aria-label="允许" />
  ) : (
    <Minus className="size-4 text-muted-foreground" aria-label="不允许" />
  );
}

export default async function RoleSettingsPage() {
  await requireAdmin();

  return (
    <>
      <SettingsPageHeader title="角色与权限" description="系统只保留一个由初始化命令维护的超级管理员。" />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>权限</TableHead>
              <TableHead>管理员</TableHead>
              <TableHead>普通用户</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.name}>
                <TableCell className="font-medium">{permission.name}</TableCell>
                <TableCell>
                  <Permission allowed={permission.admin} />
                </TableCell>
                <TableCell>
                  <Permission allowed={permission.user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
