"use client";

import { useActionState, useEffect, useState } from "react";

import { ArchiveRestore, LoaderCircle, Pencil, Plus } from "lucide-react";
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction, toggleProjectArchiveAction, updateProjectAction } from "@/features/projects/actions";
import type { ProjectDto } from "@/features/projects/schema";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult<{ id: string }> = { ok: true };

function ProjectFields({ project, state }: { project?: ProjectDto; state: ActionResult<{ id: string }> }) {
  const errors = !state.ok ? state.fieldErrors : undefined;
  return (
    <div className="space-y-4 py-2">
      {project && <input type="hidden" name="projectId" value={project.id} />}
      <div className="space-y-2">
        <Label htmlFor={`project-name-${project?.id ?? "new"}`}>项目名称</Label>
        <Input
          id={`project-name-${project?.id ?? "new"}`}
          name="name"
          defaultValue={project?.name}
          maxLength={100}
          required
        />
        {errors?.name?.map((error) => (
          <p className="text-destructive text-xs" key={error}>
            {error}
          </p>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`project-description-${project?.id ?? "new"}`}>项目描述</Label>
        <Textarea
          id={`project-description-${project?.id ?? "new"}`}
          name="description"
          defaultValue={project?.description ?? ""}
          maxLength={500}
          rows={4}
        />
        {errors?.description?.map((error) => (
          <p className="text-destructive text-xs" key={error}>
            {error}
          </p>
        ))}
      </div>
      {!state.ok && <p className="text-destructive text-sm">{state.message}</p>}
    </div>
  );
}

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createProjectAction, initialState);
  useEffect(() => {
    if (state.ok && state.data) {
      setOpen(false);
      toast.success("项目已创建");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          新建项目
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          <DialogHeader>
            <DialogTitle>新建项目</DialogTitle>
            <DialogDescription>创建一个仅你和管理员可以管理的项目。</DialogDescription>
          </DialogHeader>
          <ProjectFields state={state} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" />}创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectActions({ project }: { project: ProjectDto }) {
  const [open, setOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [state, action, pending] = useActionState(updateProjectAction, initialState);
  useEffect(() => {
    if (state.ok && state.data) {
      setOpen(false);
      toast.success("项目已更新");
    }
  }, [state]);

  async function toggleArchive() {
    setArchiving(true);
    try {
      const result = await toggleProjectArchiveAction(project.id);
      result.ok
        ? toast.success(project.status === "active" ? "项目已归档" : "项目已恢复")
        : toast.error(result.message);
    } catch {
      toast.error("更新项目状态失败，请稍后重试");
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil />
            编辑
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form action={action}>
            <DialogHeader>
              <DialogTitle>编辑项目</DialogTitle>
              <DialogDescription>更新项目的基本信息。</DialogDescription>
            </DialogHeader>
            <ProjectFields project={project} state={state} />
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <LoaderCircle className="animate-spin" />}保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={archiving}>
            <ArchiveRestore />
            {project.status === "active" ? "归档" : "恢复"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{project.status === "active" ? "归档这个项目？" : "恢复这个项目？"}</AlertDialogTitle>
            <AlertDialogDescription>
              {project.status === "active"
                ? `“${project.name}”归档后仍会保留全部数据，可以随时恢复。`
                : `“${project.name}”将恢复为进行中状态。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void toggleArchive()}>
              {project.status === "active" ? "确认归档" : "确认恢复"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
