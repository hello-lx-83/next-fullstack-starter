import type { ReactNode } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsGuard } from "@/features/settings/settings-guard";
import { SettingsNavigation } from "@/features/settings/settings-navigation";
import { requireUser } from "@/server/auth/session";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <SettingsGuard>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader title="设置" description="管理你的账户、外观与本地工作区。" />
        <div className="grid min-w-0 gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
          <SettingsNavigation />
          <div className="flex min-w-0 flex-col gap-6">{children}</div>
        </div>
      </div>
    </SettingsGuard>
  );
}
