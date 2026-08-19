"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArchiveRestore, Ellipsis, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { createProjectAction, deleteProjectAction, toggleProjectArchiveAction } from "@/features/projects/actions";
import { initialProjectFormState, ProjectFields } from "@/features/projects/project-form";
import type { ProjectDto } from "@/features/projects/schema";

export function CreateProjectDialog() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createProjectAction, initialProjectFormState);

  useEffect(() => {
    if (!state.ok || !state.data) return;
    formRef.current?.reset();
    setOpen(false);
    toast.success("项目已创建");
    router.refresh();
  }, [router, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          快速新建
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>快速新建项目</DialogTitle>
            <DialogDescription>填写基本信息后即可创建；更多操作可以在项目详情页完成。</DialogDescription>
          </DialogHeader>
          <ProjectFields state={state} idPrefix="project-dialog-new" />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectActions({ project }: { project: ProjectDto }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleArchive() {
    startTransition(async () => {
      try {
        const result = await toggleProjectArchiveAction(project.id);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(project.status === "active" ? "项目已归档" : "项目已恢复");
        router.refresh();
      } catch {
        toast.error("更新项目状态失败，请稍后重试");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`打开“${project.name}”的操作菜单`}>
          {pending ? <Spinner /> : <Ellipsis />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/projects/${project.id}`}>
              <Eye />
              查看
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              <Pencil />
              编辑
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={toggleArchive}>
            <ArchiveRestore />
            {project.status === "active" ? "归档" : "恢复"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProjectDetailActions({ project }: { project: ProjectDto }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleArchive() {
    startTransition(async () => {
      try {
        const result = await toggleProjectArchiveAction(project.id);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(project.status === "active" ? "项目已归档" : "项目已恢复");
        router.refresh();
      } catch {
        toast.error("更新项目状态失败，请稍后重试");
      }
    });
  }

  function deleteProject() {
    startTransition(async () => {
      try {
        const result = await deleteProjectAction(project.id);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("项目已永久删除");
        router.replace("/dashboard/projects");
      } catch {
        toast.error("删除项目失败，请稍后重试");
      }
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="outline" asChild>
        <Link href={`/dashboard/projects/${project.id}/edit`}>
          <Pencil data-icon="inline-start" />
          编辑
        </Link>
      </Button>
      <Button variant="outline" disabled={pending} onClick={toggleArchive}>
        {pending ? <Spinner data-icon="inline-start" /> : <ArchiveRestore data-icon="inline-start" />}
        {project.status === "active" ? "归档" : "恢复"}
      </Button>
      {project.status === "archived" ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={pending}>
              <Trash2 data-icon="inline-start" />
              永久删除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>永久删除“{project.name}”？</AlertDialogTitle>
              <AlertDialogDescription>该操作无法撤销。项目记录会从本地数据库中永久移除。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={deleteProject}>
                确认永久删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
