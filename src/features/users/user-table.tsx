"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { RotateCcw, Search, SearchX, UsersRound } from "lucide-react";

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
import { type UserListQuery, userListHref } from "@/features/users/schema";
import { UserActions } from "@/features/users/user-management";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/server/auth/permissions";
import type { UserDto } from "@/server/dal/users";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" });

export function UserTable({
  users,
  total,
  query,
  currentUserId,
}: {
  users: UserDto[];
  total: number;
  query: UserListQuery;
  currentUserId: string;
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(query.q);
  const [pending, startTransition] = useTransition();
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const hasFilters = Boolean(query.q || query.role !== "all" || query.status !== "all");

  useEffect(() => setSearchValue(query.q), [query.q]);

  function navigate(overrides: Partial<UserListQuery>) {
    startTransition(() => router.push(userListHref(query, overrides), { scroll: false }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ q: searchValue.trim(), page: 1 });
  }

  function resetFilters() {
    setSearchValue("");
    navigate({ q: "", role: "all", status: "all", page: 1 });
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" aria-busy={pending}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <form onSubmit={submitSearch} className="flex w-full max-w-md gap-2">
          <Input
            aria-label="搜索用户"
            name="q"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="搜索姓名或邮箱"
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
            value={query.role}
            onValueChange={(value) => navigate({ role: value as UserListQuery["role"], page: 1 })}
            items={[
              { value: "all", label: "全部角色" },
              { value: "admin", label: "管理员" },
              { value: "user", label: "普通用户" },
            ]}
          >
            <SelectTrigger aria-label="筛选用户角色">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            disabled={pending}
            value={query.status}
            onValueChange={(value) => navigate({ status: value as UserListQuery["status"], page: 1 })}
            items={[
              { value: "all", label: "全部状态" },
              { value: "active", label: "正常" },
              { value: "banned", label: "已停用" },
            ]}
          >
            <SelectTrigger aria-label="筛选用户状态">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="banned">已停用</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            disabled={pending}
            value={query.sort}
            onValueChange={(value) => navigate({ sort: value as UserListQuery["sort"], page: 1 })}
            items={[
              { value: "created-desc", label: "最新创建" },
              { value: "created-asc", label: "最早创建" },
              { value: "name-asc", label: "姓名升序" },
              { value: "name-desc", label: "姓名降序" },
            ]}
          >
            <SelectTrigger aria-label="用户排序">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="created-desc">最新创建</SelectItem>
                <SelectItem value="created-asc">最早创建</SelectItem>
                <SelectItem value="name-asc">姓名升序</SelectItem>
                <SelectItem value="name-desc">姓名降序</SelectItem>
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

      {users.length === 0 ? (
        <Card>
          <CardContent>
            <Empty className="min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">{hasFilters ? <SearchX /> : <UsersRound />}</EmptyMedia>
                <EmptyTitle>{hasFilters ? "没有匹配的用户" : "暂无用户"}</EmptyTitle>
                <EmptyDescription>
                  {hasFilters ? "尝试调整姓名、邮箱、角色或状态筛选。" : "创建本地账号后，用户会显示在这里。"}
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
          <Table aria-label="用户列表" className="block md:table md:table-fixed">
            <TableHeader className="hidden md:table-header-group">
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead className="w-24 text-center">角色</TableHead>
                <TableHead className="w-20 text-center">状态</TableHead>
                <TableHead className="w-32">创建时间</TableHead>
                <TableHead className="w-52 text-right xl:w-72">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="block md:table-row-group">
              {users.map((user) => (
                <TableRow key={user.id} className="grid grid-cols-2 gap-2 p-3 md:table-row md:p-0">
                  <TableCell className="col-span-2 min-w-0 whitespace-normal p-0 md:p-2">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium" title={user.name}>
                        {user.name}
                      </p>
                      {user.id === currentUserId ? <Badge variant="outline">当前账号</Badge> : null}
                    </div>
                    <p className="truncate text-muted-foreground text-xs" title={user.email}>
                      {user.email}
                    </p>
                  </TableCell>
                  <TableCell className="p-0 md:p-2 md:text-center">
                    <Badge variant={isAdmin(user.role) ? "default" : "secondary"}>
                      {isAdmin(user.role) ? "管理员" : "普通用户"}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-0 text-right md:p-2 md:text-center">
                    <Badge variant={user.banned ? "destructive" : "outline"}>{user.banned ? "已停用" : "正常"}</Badge>
                  </TableCell>
                  <TableCell className="col-span-2 p-0 text-muted-foreground md:p-2">
                    <span className="md:hidden">创建于 </span>
                    {dateFormatter.format(new Date(user.createdAt))}
                  </TableCell>
                  <TableCell className="col-span-2 whitespace-normal p-0 pt-1 md:p-2">
                    <UserActions user={user} currentUserId={currentUserId} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm" role="status">
          共 {total} 位用户
          {total > 0
            ? ` · 显示第 ${(query.page - 1) * query.pageSize + 1}–${Math.min(query.page * query.pageSize, total)} 位`
            : ""}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Select
            disabled={pending}
            value={String(query.pageSize)}
            onValueChange={(value) => navigate({ pageSize: Number(value) as UserListQuery["pageSize"], page: 1 })}
            items={[
              { value: "10", label: "每页 10 条" },
              { value: "20", label: "每页 20 条" },
              { value: "50", label: "每页 50 条" },
            ]}
          >
            <SelectTrigger size="sm" aria-label="每页用户数">
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
          <Pagination className="mx-0 w-auto" aria-label="用户分页">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={userListHref(query, { page: Math.max(1, query.page - 1) })}
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
                  href={userListHref(query, { page: Math.min(pageCount, query.page + 1) })}
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
