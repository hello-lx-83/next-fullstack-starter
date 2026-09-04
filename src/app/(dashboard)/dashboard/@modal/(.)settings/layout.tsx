import type { ReactNode } from "react";

import { SettingsDialog } from "@/features/settings/settings-dialog";
import { requireUser } from "@/server/auth/session";

export default async function SettingsModalLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <SettingsDialog>{children}</SettingsDialog>;
}
