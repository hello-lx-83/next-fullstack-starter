"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { RotateCcw, ScrollText, Search, SearchX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_VALUES, type AuditListQuery, auditListHref } from "@/features/audit/schema";
import { cn } from "@/lib/utils";
import type { AuditEventPageDto } from "@/server/dal/audit";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" });

export function AuditLog({ query, result }: { query: AuditListQuery; result: AuditEventPageDto }) {
  const { events, total, pageCount } = result;
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(query.q);
  const [pending, startTransition] = useTransition();
  const hasFilters = Boolean(query.q || query.action !== "all" || query.outcome !== "all");

  useEffect(() => setSearchValue(query.q), [query.q]);

  function navigate(overrides: Partial<AuditListQuery>) {
    startTransition(() => router.push(auditListHref(query, overrides), { scroll: false }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ q: searchValue.trim(), page: 1 });
  }

  function resetFilters() {
    setSearchValue("");
    navigate({ q: "", action: "all", outcome: "all", page: 1 });
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" aria-busy={pending}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <form onSubmit={submitSearch} className="flex w-full max-w-md gap-2">
          <Input
            aria-label="搜索审计日志"
            name="q"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="搜索操作者、目标或请求 ID"
            maxLength={100}
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <Search data-icon="inline-start" />}
            搜索
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            disabled={pending}
            items={[
              { value: "all", label: "全部操作" },
              ...AUDIT_ACTION_VALUES.map((action) => ({ value: action, label: AUDIT_ACTION_LABELS[action] })),
            ]}
            value={query.action}
            onValueChange={(value) => navigate({ action: value as AuditListQuery["action"], page: 1 })}
          >
            <SelectTrigger aria-label="筛选操作类型">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部操作</SelectItem>
                {AUDIT_ACTION_VALUES.map((action) => (
                  <SelectItem key={action} value={action}>
                    {AUDIT_ACTION_LABELS[action]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            disabled={pending}
            value={query.outcome}
            onValueChange={(value) => navigate({ outcome: value as AuditListQuery["outcome"], page: 1 })}
            items={[
              { value: "all", label: "全部结果" },
              { value: "success", label: "成功" },
              { value: "failure", label: "失败" },
            ]}
          >
            <SelectTrigger aria-label="筛选操作结果">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部结果</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failure">失败</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            disabled={pending}
            value={query.sort}
            onValueChange={(value) => navigate({ sort: value as AuditListQuery["sort"], page: 1 })}
            items={[
              { value: "created-desc", label: "最新记录" },
              { value: "created-asc", label: "最早记录" },
            ]}
          >
            <SelectTrigger aria-label="日志排序">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="created-desc">最新记录</SelectItem>
                <SelectItem value="created-asc">最早记录</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {hasFilters ? (
            <Button variant="ghost" disabled={pending} onClick={resetFilters}>
              <RotateCcw data-icon="inline-start" />
              重置
            </Button>
          ) : null}
        </div>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent>
            <Empty className="min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">{hasFilters ? <SearchX /> : <ScrollText />}</EmptyMedia>
                <EmptyTitle>{hasFilters ? "没有匹配的审计记录" : "暂无审计记录"}</EmptyTitle>
                <EmptyDescription>
                  {hasFilters
                    ? "尝试调整搜索关键词、操作类型或结果筛选。"
                    : "登录和重要操作发生后，相关记录会显示在这里。"}
                </EmptyDescription>
              </EmptyHeader>
              {hasFilters ? (
                <Button variant="outline" disabled={pending} onClick={resetFilters}>
                  <RotateCcw data-icon="inline-start" />
                  清除筛选
                </Button>
              ) : null}
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <Table aria-label="审计日志列表" className="block lg:table lg:table-fixed">
            <TableHeader className="hidden lg:table-header-group">
              <TableRow>
                <TableHead className="w-36">时间</TableHead>
                <TableHead className="w-36">操作</TableHead>
                <TableHead className="w-20 text-center">结果</TableHead>
                <TableHead>操作者</TableHead>
                <TableHead>目标</TableHead>
                <TableHead>请求 ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="block lg:table-row-group">
              {events.map((event) => (
                <TableRow key={event.id} className="grid grid-cols-2 gap-2 p-3 lg:table-row lg:p-0">
                  <TableCell className="col-span-2 p-0 text-muted-foreground lg:p-2">
                    <time dateTime={event.createdAt}>{dateFormatter.format(new Date(event.createdAt))}</time>
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-normal p-0 font-medium lg:p-2">
                    {AUDIT_ACTION_LABELS[event.action] ?? event.action}
                  </TableCell>
                  <TableCell className="p-0 text-right lg:p-2 lg:text-center">
                    <Badge variant={event.outcome === "failure" ? "destructive" : "outline"}>
                      {event.outcome === "failure" ? "失败" : "成功"}
                    </Badge>
                  </TableCell>
                  <TableCell className="col-span-2 min-w-0 whitespace-normal p-0 lg:p-2">
                    <span className="text-muted-foreground lg:hidden">操作者：</span>
                    <span className="block truncate" title={event.actorName ?? undefined}>
                      {event.actorName ?? "系统或已删除用户"}
                    </span>
                    {event.actorEmail ? (
                      <span className="block truncate text-muted-foreground text-xs" title={event.actorEmail}>
                        {event.actorEmail}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="col-span-2 min-w-0 whitespace-normal p-0 lg:p-2">
                    <span className="text-muted-foreground lg:hidden">目标：</span>
                    <span
                      className="wrap-anywhere block font-mono text-xs"
                      title={[event.targetType, event.targetId].filter(Boolean).join(" · ")}
                    >
                      {[event.targetType, event.targetId].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="col-span-2 min-w-0 whitespace-normal p-0 lg:p-2">
                    <span className="text-muted-foreground lg:hidden">请求 ID：</span>
                    <span className="wrap-anywhere block font-mono text-xs">{event.requestId ?? "—"}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm" role="status">
          共 {total} 条记录
          {total > 0
            ? ` · 显示第 ${(query.page - 1) * query.pageSize + 1}–${Math.min(query.page * query.pageSize, total)} 条`
            : ""}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Select
            disabled={pending}
            value={String(query.pageSize)}
            onValueChange={(value) => navigate({ pageSize: Number(value) as AuditListQuery["pageSize"], page: 1 })}
            items={[
              { value: "10", label: "每页 10 条" },
              { value: "20", label: "每页 20 条" },
              { value: "50", label: "每页 50 条" },
            ]}
          >
            <SelectTrigger size="sm" aria-label="每页日志数">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="10">每页 10 条</SelectItem>
                <SelectItem value="20">每页 20 条</SelectItem>
                <SelectItem value="50">每页 50 条</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Pagination className="mx-0 w-auto" aria-label="审计日志分页">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={auditListHref(query, { page: Math.max(1, query.page - 1) })}
                  text="上一页"
                  aria-label="前往上一页"
                  aria-disabled={query.page <= 1 || pending}
                  tabIndex={query.page <= 1 || pending ? -1 : undefined}
                  className={cn((query.page <= 1 || pending) && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    if (query.page <= 1 || pending) event.preventDefault();
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-2 text-sm tabular-nums">
                  第 {query.page} / {pageCount} 页
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href={auditListHref(query, { page: Math.min(pageCount, query.page + 1) })}
                  text="下一页"
                  aria-label="前往下一页"
                  aria-disabled={query.page >= pageCount || pending}
                  tabIndex={query.page >= pageCount || pending ? -1 : undefined}
                  className={cn((query.page >= pageCount || pending) && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    if (query.page >= pageCount || pending) event.preventDefault();
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
