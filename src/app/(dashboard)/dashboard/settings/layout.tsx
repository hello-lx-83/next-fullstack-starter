import type { ReactNode } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsNavigation } from "@/features/settings/settings-navigation";
import { isAdmin } from "@/server/auth/permissions";
import { requireUser } from "@/server/auth/session";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="设置" description="管理你的账户、外观、数据与本地工作区。" />
      <div className="grid min-w-0 gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
        <SettingsNavigation isAdmin={isAdmin(session.user.role)} />
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}
