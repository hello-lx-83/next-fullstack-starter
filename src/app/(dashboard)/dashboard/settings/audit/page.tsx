import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_VALUES,
  type AuditListQuery,
  auditListQuerySchema,
} from "@/features/audit/schema";
import { listAuditEvents } from "@/server/dal/audit";

interface AuditPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getPageHref(query: AuditListQuery, page: number): string {
  const params = new URLSearchParams();
  if (query.action !== "all") params.set("action", query.action);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return `/dashboard/settings/audit${search ? `?${search}` : ""}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatTarget(targetType: string | null, targetId: string | null): string {
  if (!targetType && !targetId) return "—";
  return [targetType, targetId].filter(Boolean).join(" · ");
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const rawQuery = await searchParams;
  const query = auditListQuerySchema.parse({
    action: Array.isArray(rawQuery.action) ? rawQuery.action[0] : rawQuery.action,
    page: Array.isArray(rawQuery.page) ? rawQuery.page[0] : rawQuery.page,
  });
  const result = await listAuditEvents(query);

  return (
    <Card>
      <CardHeader>
        <CardTitle>审计日志</CardTitle>
        <CardDescription>查看重要的账号、权限和数据操作。运行日志仍由服务器或日志平台管理。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-2" method="get">
          <label className="flex flex-col gap-1 font-medium text-sm" htmlFor="audit-action">
            操作类型
            <NativeSelect defaultValue={query.action} id="audit-action" name="action">
              <NativeSelectOption value="all">全部操作</NativeSelectOption>
              {AUDIT_ACTION_VALUES.map((action) => (
                <NativeSelectOption key={action} value={action}>
                  {AUDIT_ACTION_LABELS[action]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <Button type="submit" variant="outline">
            筛选
          </Button>
        </form>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>操作者</TableHead>
                <TableHead>目标</TableHead>
                <TableHead>请求 ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.events.length === 0 ? (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                    暂无审计记录
                  </TableCell>
                </TableRow>
              ) : (
                result.events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{formatDate(event.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{AUDIT_ACTION_LABELS[event.action] ?? event.action}</span>
                        {event.outcome === "failure" ? <Badge variant="destructive">失败</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.actorName ? (
                        <div className="flex flex-col">
                          <span>{event.actorName}</span>
                          <span className="text-muted-foreground text-xs">{event.actorEmail}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">系统或已删除用户</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="max-w-64 truncate font-mono text-xs"
                      title={formatTarget(event.targetType, event.targetId)}
                    >
                      {formatTarget(event.targetType, event.targetId)}
                    </TableCell>
                    <TableCell className="max-w-48 truncate font-mono text-xs" title={event.requestId ?? undefined}>
                      {event.requestId ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground text-sm">
          <span>共 {result.total} 条记录</span>
          {result.pageCount > 1 ? (
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    aria-disabled={result.page <= 1}
                    className={result.page <= 1 ? "pointer-events-none opacity-50" : undefined}
                    href={getPageHref(query, result.page - 1)}
                    text="上一页"
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-3">
                    第 {result.page} / {result.pageCount} 页
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    aria-disabled={result.page >= result.pageCount}
                    className={result.page >= result.pageCount ? "pointer-events-none opacity-50" : undefined}
                    href={getPageHref(query, result.page + 1)}
                    text="下一页"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
