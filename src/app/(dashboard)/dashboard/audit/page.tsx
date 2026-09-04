import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { AuditLog } from "@/features/audit/audit-log";
import { auditListHref, parseAuditListQuery } from "@/features/audit/schema";
import { requireAdmin } from "@/server/auth/session";
import { listAuditEvents } from "@/server/dal/audit";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const query = parseAuditListQuery(await searchParams);
  const result = await listAuditEvents(query);
  if (query.page !== result.page) redirect(auditListHref(query, { page: result.page }));

  return (
    <>
      <PageHeader title="审计日志" description="查看重要的账号、权限和数据操作记录。" />
      <AuditLog query={query} result={result} />
    </>
  );
}
