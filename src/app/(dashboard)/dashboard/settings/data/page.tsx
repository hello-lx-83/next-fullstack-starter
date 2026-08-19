import { Database, DatabaseBackup, ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { SettingsPageHeader } from "@/features/settings/settings-page-header";
import { requireUser } from "@/server/auth/session";

export default async function DataSettingsPage() {
  await requireUser();

  return (
    <>
      <SettingsPageHeader title="数据与备份" description="了解本地数据、导出与恢复方式。" />
      <section className="space-y-5">
        <div>
          <h2 className="font-medium">本地数据</h2>
          <p className="mt-1 text-muted-foreground text-sm">应用数据保存在项目目录中，不依赖外部云服务。</p>
        </div>
        <Separator />
        <FieldGroup>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>存储引擎</FieldTitle>
              <FieldDescription>单文件数据库，适合个人工具和本地部署。</FieldDescription>
            </FieldContent>
            <Badge variant="secondary">
              <Database />
              SQLite
            </Badge>
          </Field>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>默认数据目录</FieldTitle>
              <FieldDescription>数据库、WAL 和备份文件均应保留在本机。</FieldDescription>
            </FieldContent>
            <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">data/</code>
          </Field>
        </FieldGroup>
      </section>

      <Separator />

      <section className="space-y-5">
        <div>
          <h2 className="font-medium">备份</h2>
          <p className="mt-1 text-muted-foreground text-sm">使用项目内置命令创建经过 SQLite 校验的时间戳备份。</p>
        </div>
        <Alert>
          <DatabaseBackup />
          <AlertTitle>创建安全备份</AlertTitle>
          <AlertDescription>
            在项目目录执行 <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">pnpm db:backup</code>。
            备份完成后，命令会输出文件位置和校验结果。
          </AlertDescription>
        </Alert>
      </section>

      <Separator />

      <section className="space-y-5">
        <div>
          <h2 className="font-medium">恢复数据</h2>
          <p className="mt-1 text-muted-foreground text-sm">恢复会替换当前数据库，因此不在运行中的网页界面直接执行。</p>
        </div>
        <Alert>
          <ShieldAlert />
          <AlertTitle>恢复前先停止应用</AlertTitle>
          <AlertDescription>
            确认备份可用并额外保存当前数据库，再在应用停止后通过文件系统恢复，避免损坏正在使用的数据。
          </AlertDescription>
        </Alert>
      </section>
    </>
  );
}
