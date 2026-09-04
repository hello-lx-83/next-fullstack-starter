import { AppearanceSettings } from "@/features/settings/appearance-settings";
import { SettingsPageHeader } from "@/features/settings/settings-page-header";
import { requireUser } from "@/server/auth/session";

export default async function AppearanceSettingsPage() {
  await requireUser();

  return (
    <>
      <SettingsPageHeader title="外观" description="调整主题、字体与界面布局。" />
      <AppearanceSettings />
    </>
  );
}
