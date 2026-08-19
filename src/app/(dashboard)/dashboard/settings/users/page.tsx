import { SettingsPageHeader } from "@/features/settings/settings-page-header";
import { CreateUserDialog, UserTable } from "@/features/users/user-management";
import { requireAdmin } from "@/server/auth/session";
import { listUsers } from "@/server/dal/users";

export default async function UserSettingsPage() {
  const [session, users] = await Promise.all([requireAdmin(), listUsers()]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SettingsPageHeader title="用户" description="创建本地账号、分配角色并控制账号状态。" />
        <CreateUserDialog />
      </div>
      <UserTable users={users} currentUserId={session.user.id} />
    </>
  );
}
