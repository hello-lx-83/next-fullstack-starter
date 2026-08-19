import { Database, HeartPulse, Laptop, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";
import { SettingsPageHeader } from "@/features/settings/settings-page-header";
import { requireUser } from "@/server/auth/session";
import { getHealthStatus } from "@/server/health";

export default async function AboutSettingsPage() {
  await requireUser();
  const health = getHealthStatus();

  return (
    <>
      <SettingsPageHeader title="关于" description="查看应用版本、运行模式与本地系统状态。" />
      <section className="space-y-5">
        <div>
          <h2 className="font-medium">应用信息</h2>
          <p className="mt-1 text-muted-foreground text-sm">用于确认当前模板版本与运行方式。</p>
        </div>
        <Separator />
        <FieldGroup>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>{APP_CONFIG.name}</FieldTitle>
              <FieldDescription>本地优先的个人工具全栈模板。</FieldDescription>
            </FieldContent>
            <Badge variant="outline">v{APP_CONFIG.version}</Badge>
          </Field>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>运行模式</FieldTitle>
              <FieldDescription>应用、鉴权和数据服务均由本机项目提供。</FieldDescription>
            </FieldContent>
            <Badge variant="secondary">
              <Laptop />
              本地运行
            </Badge>
          </Field>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>数据存储</FieldTitle>
              <FieldDescription>项目使用 SQLite 保存业务数据。</FieldDescription>
            </FieldContent>
            <Badge variant="secondary">
              <Database />
              SQLite
            </Badge>
          </Field>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>系统状态</FieldTitle>
              <FieldDescription>基于数据库快速完整性检查得出。</FieldDescription>
            </FieldContent>
            <Badge variant={health.status === "ok" ? "secondary" : "destructive"}>
              <HeartPulse />
              {health.status === "ok" ? "运行正常" : "需要检查"}
            </Badge>
          </Field>
        </FieldGroup>
      </section>

      <Separator />

      <Alert>
        <ShieldCheck />
        <AlertTitle>隐私与安全边界</AlertTitle>
        <AlertDescription>
          此页面只展示必要的版本和健康状态，不会暴露数据库绝对路径、环境变量、会话或密钥。
        </AlertDescription>
      </Alert>
    </>
  );
}
