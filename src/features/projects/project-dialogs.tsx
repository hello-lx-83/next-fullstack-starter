"use client";

import { type ReactNode, useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { ArchiveRestore, Ellipsis, Eye, Pencil, Save, Trash2 } from "lucide-react";
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
import {
  createProjectAction,
  deleteProjectAction,
  toggleProjectArchiveAction,
  updateProjectAction,
} from "@/features/projects/actions";
import { initialProjectFormState, ProjectFields } from "@/features/projects/project-fields";
import type { ProjectDto } from "@/features/projects/schema";

type ProjectDialogMode = "create" | "view" | "edit";

const dialogCopy: Record<ProjectDialogMode, { title: string; description: string }> = {
  create: { title: "新建项目", description: "填写项目字段并创建记录。" },
  view: { title: "项目详情", description: "查看项目的全部字段。" },
  edit: { title: "编辑项目", description: "修改项目字段并保存。" },
};

export function ProjectDialog({
  mode,
  project,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  mode: ProjectDialogMode;
  project?: ProjectDto;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const action = mode === "create" ? createProjectAction : updateProjectAction;
  const [state, formAction, pending] = useActionState(action, initialProjectFormState);
  const open = controlledOpen ?? internalOpen;
  const readOnly = mode === "view";
  const copy = dialogCopy[mode];

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  useEffect(() => {
    if (!state.ok || !state.data) return;
    if (mode === "create") formRef.current?.reset();
    setOpen(false);
    toast.success(mode === "create" ? "项目已创建" : "项目已更新");
    router.refresh();
  }, [mode, router, setOpen, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
        <form ref={formRef} action={formAction} className="contents">
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto px-1">
            <ProjectFields
              project={project}
              state={state}
              idPrefix={project ? `project-${mode}-${project.id}` : "project-create"}
              readOnly={readOnly}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {readOnly ? "关闭" : "取消"}
              </Button>
            </DialogClose>
            {readOnly ? null : (
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
                {mode === "create" ? "创建" : "保存"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectActions({ project }: { project: ProjectDto }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
        setDeleteOpen(false);
        toast.success("项目已永久删除");
        router.refresh();
      } catch {
        toast.error("删除项目失败，请稍后重试");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`打开“${project.name}”的操作菜单`}>
            {pending ? <Spinner /> : <Ellipsis />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setDialogMode("view")}>
              <Eye />
              查看
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialogMode("edit")}>
              <Pencil />
              编辑
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={toggleArchive}>
              <ArchiveRestore />
              {project.status === "active" ? "归档" : "恢复"}
            </DropdownMenuItem>
            {project.status === "archived" ? (
              <DropdownMenuItem onSelect={() => setDeleteOpen(true)}>
                <Trash2 />
                删除
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogMode ? (
        <ProjectDialog
          mode={dialogMode}
          project={project}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setDialogMode(null);
          }}
        />
      ) : null}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>永久删除“{project.name}”？</AlertDialogTitle>
            <AlertDialogDescription>该操作无法撤销。项目记录会从本地数据库中永久移除。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteProject}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
