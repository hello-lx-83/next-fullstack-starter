"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { ArchiveRestore, Ellipsis, Eye, Pencil, Plus, Save, Trash2 } from "lucide-react";

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
import { toast } from "@/components/ui/toast";
import {
  createProjectAction,
  deleteProjectAction,
  toggleProjectArchiveAction,
  updateProjectAction,
} from "@/features/projects/actions";
import type { ProjectDto } from "@/features/projects/contracts";
import { initialProjectFormState, ProjectFields } from "@/features/projects/project-fields";

type ProjectDialogMode = "create" | "view" | "edit";

const dialogCopy: Record<ProjectDialogMode, { title: string; description: string }> = {
  create: { title: "新建项目", description: "填写项目字段并创建记录。" },
  view: { title: "项目详情", description: "查看项目的全部字段。" },
  edit: { title: "编辑项目", description: "修改项目字段并保存。" },
};

export function ProjectDialog({
  mode,
  project,
  open: controlledOpen,
  onOpenChange,
}: {
  mode: ProjectDialogMode;
  project?: ProjectDto;
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
    toast.add({ type: "success", title: mode === "create" ? "项目已创建" : "项目已更新" });
    router.refresh();
  }, [mode, router, setOpen, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus data-icon="inline-start" />
          新建项目
        </DialogTrigger>
      ) : null}
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
            <DialogClose render={<Button type="button" variant="outline" />}>{readOnly ? "关闭" : "取消"}</DialogClose>
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
          toast.add({ type: "error", title: result.message });
          return;
        }
        toast.add({ type: "success", title: project.status === "active" ? "项目已归档" : "项目已恢复" });
        router.refresh();
      } catch {
        toast.add({ type: "error", title: "更新项目状态失败，请稍后重试" });
      }
    });
  }

  function deleteProject() {
    startTransition(async () => {
      try {
        const result = await deleteProjectAction(project.id);
        if (!result.ok) {
          toast.add({ type: "error", title: result.message });
          return;
        }
        setDeleteOpen(false);
        toast.add({ type: "success", title: "项目已永久删除" });
        router.refresh();
      } catch {
        toast.add({ type: "error", title: "删除项目失败，请稍后重试" });
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`打开“${project.name}”的操作菜单`} />
          }
        >
          {pending ? <Spinner /> : <Ellipsis />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setDialogMode("view")}>
              <Eye />
              查看
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDialogMode("edit")}>
              <Pencil />
              编辑
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={toggleArchive}>
              <ArchiveRestore />
              {project.status === "active" ? "归档" : "恢复"}
            </DropdownMenuItem>
            {project.status === "archived" ? (
              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
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
            <AlertDialogAction disabled={pending} variant="destructive" onClick={deleteProject}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
