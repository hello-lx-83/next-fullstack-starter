import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { parseUserListQuery, userListHref } from "@/features/users/schema";
import { CreateUserDialog } from "@/features/users/user-management";
import { UserTable } from "@/features/users/user-table";
import { requireAdmin } from "@/server/auth/session";
import { listUsers } from "@/server/dal/users";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseUserListQuery(await searchParams);
  const [session, result] = await Promise.all([requireAdmin(), listUsers(query)]);
  const pageCount = Math.max(1, Math.ceil(result.total / query.pageSize));
  if (query.page > pageCount) redirect(userListHref(query, { page: pageCount }));

  return (
    <>
      <PageHeader title="用户" description="创建本地账号、管理账号状态和重置密码。" actions={<CreateUserDialog />} />
      <UserTable users={result.users} total={result.total} query={query} currentUserId={session.user.id} />
    </>
  );
}
