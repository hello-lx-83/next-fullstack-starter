import { ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PasswordForm } from "@/features/profile/profile-forms";
import { SessionList } from "@/features/sessions/session-list";
import { SettingsPageHeader } from "@/features/settings/settings-page-header";
import { requireUser } from "@/server/auth/session";
import { listCurrentUserSessions } from "@/server/dal/sessions";

export default async function SecuritySettingsPage() {
  await requireUser();
  const sessions = await listCurrentUserSessions();

  return (
    <>
      <SettingsPageHeader title="安全" description="管理密码与当前账号的登录会话。" />
      <section className="flex flex-col gap-5" aria-labelledby="change-password-title">
        <div className="flex flex-col gap-1">
          <h3 id="change-password-title" className="font-medium">
            修改密码
          </h3>
          <p className="text-muted-foreground text-sm">使用当前密码验证身份后设置新的登录密码。</p>
        </div>
        <Separator />
        <PasswordForm />
      </section>
      <Alert>
        <ShieldCheck />
        <AlertTitle>其他设备会话会被撤销</AlertTitle>
        <AlertDescription>密码修改成功后，其他设备需要重新登录，当前设备保持登录状态。</AlertDescription>
      </Alert>
      <section className="flex flex-col gap-5" aria-labelledby="sessions-title">
        <div className="flex flex-col gap-1">
          <h3 id="sessions-title" className="font-medium">
            登录会话
          </h3>
          <p className="text-muted-foreground text-sm">查看当前账号的登录设备，并撤销不再使用的会话。</p>
        </div>
        <Separator />
        <SessionList sessions={sessions} />
      </section>
    </>
  );
}
