import { ProfileForm } from "@/features/profile/profile-forms";
import { SettingsPageHeader } from "@/features/settings/settings-page-header";
import { requireUser } from "@/server/auth/session";

export default async function ProfileSettingsPage() {
  const session = await requireUser();

  return (
    <>
      <SettingsPageHeader title="个人资料" description="管理当前账号的基本信息。" />
      <ProfileForm name={session.user.name} email={session.user.email} />
    </>
  );
}
