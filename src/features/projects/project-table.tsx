"use client";

import { type FormEvent, type ReactNode, useEffect, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { createColumnHelper, useTable } from "@tanstack/react-table";
import {
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  FolderKanban,
  RotateCcw,
  Search,
  SearchX,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { setProjectsStatusAction } from "@/features/projects/actions";
import { ProjectActions } from "@/features/projects/project-dialogs";
import { type ProjectDto, type ProjectListQuery, type ProjectSort, projectListHref } from "@/features/projects/schema";
import { dataTableFeatures } from "@/lib/data-table-features";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<typeof dataTableFeatures, ProjectDto>();

const projectColumns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    enableHiding: false,
    header: ({ table }) => {
      let checked: boolean | "indeterminate" = false;
      if (table.getIsAllPageRowsSelected()) checked = true;
      else if (table.getIsSomePageRowsSelected()) checked = "indeterminate";
      return (
        <Checkbox
          aria-label="选择当前页全部项目"
          checked={checked}
          onCheckedChange={(nextChecked) => table.toggleAllPageRowsSelected(Boolean(nextChecked))}
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        aria-label={`选择项目“${row.original.name}”`}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
      />
    ),
  }),
  columnHelper.accessor("name", {
    header: "名称",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("description", {
    header: "描述",
    cell: ({ getValue }) => <p className="max-w-md truncate text-muted-foreground">{getValue() || "-"}</p>,
  }),
  columnHelper.accessor("ownerName", { id: "owner", header: "所有者" }),
  columnHelper.accessor("status", {
    header: "状态",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <Badge variant={status === "active" ? "secondary" : "outline"}>
          {status === "active" ? "进行中" : "已归档"}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("updatedAt", {
    header: "更新时间",
    cell: ({ getValue }) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(getValue())),
  }),
  columnHelper.accessor("createdAt", {
    header: "创建时间",
    cell: ({ getValue }) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(getValue())),
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">操作</span>,
    cell: ({ row }) => <ProjectActions project={row.original} />,
  }),
]);

const projectColumnsWithoutOwner = projectColumns.filter((column) => column.id !== "owner");

const sortableColumns: Record<string, { asc: ProjectSort; desc: ProjectSort }> = {
  name: { asc: "name-asc", desc: "name-desc" },
  updatedAt: { asc: "updated-asc", desc: "updated-desc" },
  createdAt: { asc: "created-asc", desc: "created-desc" },
};

function getSortDirection(columnId: string, sort: ProjectSort) {
  const config = sortableColumns[columnId];
  if (!config) return false;
  if (sort === config.asc) return "asc";
  if (sort === config.desc) return "desc";
  return false;
}

function SortDirectionIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp data-icon="inline-end" />;
  if (direction === "desc") return <ArrowDown data-icon="inline-end" />;
  return <ArrowUpDown data-icon="inline-end" />;
}

export function ProjectTable({
  projects,
  total,
  query,
  showOwner,
}: {
  projects: ProjectDto[];
  total: number;
  query: ProjectListQuery;
  showOwner: boolean;
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(query.q);
  const [pending, startTransition] = useTransition();
  const columns = showOwner ? projectColumns : projectColumnsWithoutOwner;
  const table = useTable({
    features: dataTableFeatures,
    data: projects,
    columns,
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    rowCount: total,
  });
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const hasFilters = Boolean(query.q || query.status !== "all");

  useEffect(() => {
    setSearchValue(query.q);
  }, [query.q]);

  function navigate(overrides: Partial<ProjectListQuery>) {
    startTransition(() => router.replace(projectListHref(query, overrides), { scroll: false }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ q: searchValue.trim(), page: 1 });
  }

  function toggleSort(columnId: string) {
    const config = sortableColumns[columnId];
    if (!config) return;
    const direction = getSortDirection(columnId, query.sort);
    navigate({ sort: direction === "asc" ? config.desc : config.asc, page: 1 });
  }

  function updateSelected(status: "active" | "archived") {
    startTransition(async () => {
      try {
        const result = await setProjectsStatusAction(selectedIds, status);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        table.resetRowSelection(true);
        const updated = result.data?.updated ?? 0;
        toast.success(status === "archived" ? `已归档 ${updated} 个项目` : `已恢复 ${updated} 个项目`);
        router.refresh();
      } catch {
        toast.error("批量更新项目失败，请稍后重试");
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" aria-busy={pending}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={submitSearch} className="flex w-full max-w-md gap-2">
          <Input
            aria-label="搜索项目"
            name="q"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="搜索名称或描述"
            maxLength={100}
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <Search data-icon="inline-start" />}
            搜索
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={query.status}
            onValueChange={(value) => navigate({ status: value as ProjectListQuery["status"], page: 1 })}
          >
            <SelectTrigger aria-label="筛选项目状态">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3 data-icon="inline-start" />
                显示列
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>切换显示列</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
                    >
                      {{
                        name: "名称",
                        description: "描述",
                        owner: "所有者",
                        status: "状态",
                        updatedAt: "更新时间",
                        createdAt: "创建时间",
                      }[column.id] ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {hasFilters ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchValue("");
                navigate({ q: "", status: "all", page: 1 });
              }}
            >
              <RotateCcw data-icon="inline-start" />
              重置
            </Button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {selectedRows.length > 0 ? (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/50 p-3"
          >
            <p className="text-sm">已选择 {selectedRows.length} 个当前页项目</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => updateSelected("active")}>
                <ArchiveRestore data-icon="inline-start" />
                恢复
              </Button>
              <Button variant="outline" size="sm" onClick={() => updateSelected("archived")}>
                <ArchiveRestore data-icon="inline-start" />
                归档
              </Button>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
        <m.div
          key={`${query.q}-${query.status}-${query.sort}-${query.page}-${query.pageSize}-${total}`}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {projects.length === 0 ? (
            <Card>
              <CardContent>
                <Empty className="min-h-72 border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">{hasFilters ? <SearchX /> : <FolderKanban />}</EmptyMedia>
                    <EmptyTitle>{hasFilters ? "没有匹配的项目" : "还没有项目"}</EmptyTitle>
                    <EmptyDescription>
                      {hasFilters ? "尝试调整搜索关键字或状态筛选。" : "创建第一个项目，体验完整的增删改查流程。"}
                    </EmptyDescription>
                  </EmptyHeader>
                  {hasFilters ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchValue("");
                        navigate({ q: "", status: "all", page: 1 });
                      }}
                    >
                      <RotateCcw data-icon="inline-start" />
                      清除筛选
                    </Button>
                  ) : null}
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <Card className="py-0">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const direction = getSortDirection(header.column.id, query.sort);
                        const sortable = Boolean(sortableColumns[header.column.id]);
                        let content: ReactNode = null;
                        if (!header.isPlaceholder) {
                          content = sortable ? (
                            <Button variant="ghost" size="sm" onClick={() => toggleSort(header.column.id)}>
                              <table.FlexRender header={header} />
                              <SortDirectionIcon direction={direction} />
                            </Button>
                          ) : (
                            <table.FlexRender header={header} />
                          );
                        }
                        return (
                          <TableHead
                            key={header.id}
                            className={header.column.id === "actions" ? "text-right" : undefined}
                          >
                            {content}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : undefined}>
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </m.div>
      </AnimatePresence>

      <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">共 {total} 个项目</p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Select
            value={String(query.pageSize)}
            onValueChange={(value) => navigate({ pageSize: Number(value) as ProjectListQuery["pageSize"], page: 1 })}
          >
            <SelectTrigger size="sm" aria-label="每页项目数">
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
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={projectListHref(query, { page: Math.max(1, query.page - 1) })}
                  text="上一页"
                  aria-label="前往上一页"
                  aria-disabled={query.page <= 1}
                  tabIndex={query.page <= 1 ? -1 : undefined}
                  className={cn(query.page <= 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-2 text-sm tabular-nums">
                  第 {query.page} / {pageCount} 页
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href={projectListHref(query, { page: Math.min(pageCount, query.page + 1) })}
                  text="下一页"
                  aria-label="前往下一页"
                  aria-disabled={query.page >= pageCount}
                  tabIndex={query.page >= pageCount ? -1 : undefined}
                  className={cn(query.page >= pageCount && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
