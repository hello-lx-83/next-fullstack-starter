"use client";

import { useActionState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction, updateProjectAction } from "@/features/projects/actions";
import type { ProjectDto } from "@/features/projects/schema";
import type { ActionResult } from "@/lib/action-result";

export const initialProjectFormState: ActionResult<{ id: string }> = { ok: true };

function formatErrors(errors: string[] | undefined) {
  return errors?.map((message) => ({ message }));
}

export function ProjectFields({
  project,
  state,
  idPrefix,
}: {
  project?: ProjectDto;
  state: ActionResult<{ id: string }>;
  idPrefix: string;
}) {
  const errors = state.ok ? undefined : state.fieldErrors;
  const nameInvalid = Boolean(errors?.name?.length);
  const descriptionInvalid = Boolean(errors?.description?.length);

  return (
    <FieldGroup>
      {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
      <Field data-invalid={nameInvalid}>
        <FieldLabel htmlFor={`${idPrefix}-name`}>项目名称</FieldLabel>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          defaultValue={project?.name}
          maxLength={100}
          autoComplete="off"
          aria-invalid={nameInvalid}
          required
        />
        <FieldDescription>使用清晰、便于识别的名称，最多 100 个字符。</FieldDescription>
        <FieldError errors={formatErrors(errors?.name)} />
      </Field>
      <Field data-invalid={descriptionInvalid}>
        <FieldLabel htmlFor={`${idPrefix}-description`}>项目描述</FieldLabel>
        <Textarea
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={project?.description ?? ""}
          maxLength={500}
          rows={6}
          aria-invalid={descriptionInvalid}
        />
        <FieldDescription>可选。记录项目目标、范围或交付要求，最多 500 个字符。</FieldDescription>
        <FieldError errors={formatErrors(errors?.description)} />
      </Field>
      {!state.ok ? (
        <Field>
          <FieldError aria-live="polite">{state.message}</FieldError>
        </Field>
      ) : null}
    </FieldGroup>
  );
}

export function ProjectForm({ project }: { project?: ProjectDto }) {
  const router = useRouter();
  const action = project ? updateProjectAction : createProjectAction;
  const [state, formAction, pending] = useActionState(action, initialProjectFormState);
  const projectId = project?.id;

  useEffect(() => {
    if (!state.ok || !state.data) return;
    toast.success(projectId ? "项目已更新" : "项目已创建");
    router.push(`/dashboard/projects/${state.data.id}`);
  }, [projectId, router, state]);

  return (
    <form action={formAction}>
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>{project ? "编辑项目信息" : "创建项目"}</CardTitle>
          <CardDescription>
            {project ? "更新项目名称和描述；项目状态在详情页单独管理。" : "创建后可以继续查看详情或调整项目状态。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectFields project={project} state={state} idPrefix={project ? `project-${project.id}` : "project-new"} />
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href={project ? `/dashboard/projects/${project.id}` : "/dashboard/projects"}>取消</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
            {project ? "保存更改" : "创建项目"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
