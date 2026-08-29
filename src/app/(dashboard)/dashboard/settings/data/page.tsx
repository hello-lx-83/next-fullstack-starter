import { DatabaseBackup, HardDrive, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { SettingsPageHeader } from "@/features/settings/settings-page-header";
import { requireUser } from "@/server/auth/session";
import { getDataProtectionStatus } from "@/server/data-protection";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function DataSettingsPage() {
  await requireUser();
  const status = await getDataProtectionStatus();

  return (
    <>
      <SettingsPageHeader title="数据与备份" description="查看本地数据状态，并按停机流程保护和恢复数据。" />
      <section className="flex flex-col gap-5" aria-labelledby="data-storage-title">
        <div className="flex flex-col gap-1">
          <h3 id="data-storage-title" className="font-medium">
            数据存储
          </h3>
          <p className="text-muted-foreground text-sm">页面只展示必要信息，不暴露数据库绝对路径。</p>
        </div>
        <Separator />
        <FieldGroup>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>数据库文件</FieldTitle>
              <FieldDescription>业务数据和认证数据保存在同一个 SQLite 数据库中。</FieldDescription>
            </FieldContent>
            <Badge variant="secondary">
              <HardDrive />
              {status.databaseFileName}
            </Badge>
          </Field>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>已发现备份</FieldTitle>
              <FieldDescription>
                {status.latestBackupAt
                  ? `最近一次：${dateFormatter.format(new Date(status.latestBackupAt))}`
                  : "尚未发现经过脚本创建的备份。"}
              </FieldDescription>
            </FieldContent>
            <Badge variant={status.backupCount > 0 ? "secondary" : "outline"}>{status.backupCount} 份</Badge>
          </Field>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>备份位置</FieldTitle>
              <FieldDescription>
                {status.usesCustomBackupDirectory
                  ? "已使用 BACKUP_DIRECTORY 指定的独立位置。"
                  : "当前使用数据库同级目录，只能防误操作，不能防磁盘故障。"}
              </FieldDescription>
            </FieldContent>
            <Badge variant={status.usesCustomBackupDirectory ? "secondary" : "outline"}>
              {status.usesCustomBackupDirectory ? "独立目录" : "同机目录"}
            </Badge>
          </Field>
        </FieldGroup>
      </section>

      <Alert>
        <DatabaseBackup />
        <AlertTitle>先备份，再迁移</AlertTitle>
        <AlertDescription>
          在终端运行{" "}
          <code className="rounded bg-muted px-1.5 py-1 font-mono text-foreground text-xs">pnpm db:backup</code>
          ，确认校验通过后再执行数据库迁移。
        </AlertDescription>
      </Alert>

      <Alert>
        <ShieldCheck />
        <AlertTitle>恢复必须在应用停止后执行</AlertTitle>
        <AlertDescription>
          不要在运行中的界面覆盖 SQLite 文件。重要数据还应复制到另一块磁盘、NAS 或加密同步目录。
        </AlertDescription>
      </Alert>
    </>
  );
}
