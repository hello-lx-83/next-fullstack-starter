"use client";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  readOnly,
}: {
  project?: ProjectDto;
  state: ActionResult<{ id: string }>;
  idPrefix: string;
  readOnly: boolean;
}) {
  const errors = state.ok ? undefined : state.fieldErrors;
  const nameInvalid = Boolean(errors?.name?.length);
  const descriptionInvalid = Boolean(errors?.description?.length);

  return (
    <FieldGroup>
      {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
      <Field data-invalid={nameInvalid} data-disabled={readOnly || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-name`}>名称</FieldLabel>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          defaultValue={project?.name}
          maxLength={100}
          autoComplete="off"
          aria-invalid={nameInvalid}
          disabled={readOnly}
          required
        />
        {readOnly ? null : <FieldDescription>最多 100 个字符。</FieldDescription>}
        <FieldError errors={formatErrors(errors?.name)} />
      </Field>
      <Field data-invalid={descriptionInvalid} data-disabled={readOnly || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-description`}>描述</FieldLabel>
        <Textarea
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={project?.description ?? ""}
          maxLength={500}
          rows={4}
          aria-invalid={descriptionInvalid}
          disabled={readOnly}
        />
        {readOnly ? null : <FieldDescription>可选，最多 500 个字符。</FieldDescription>}
        <FieldError errors={formatErrors(errors?.description)} />
      </Field>
      {project ? (
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <Field data-disabled>
            <FieldLabel htmlFor={`${idPrefix}-owner`}>所有者</FieldLabel>
            <Input id={`${idPrefix}-owner`} defaultValue={project.ownerName} disabled />
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor={`${idPrefix}-status`}>状态</FieldLabel>
            <Input
              id={`${idPrefix}-status`}
              defaultValue={project.status === "active" ? "进行中" : "已归档"}
              disabled
            />
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor={`${idPrefix}-created-at`}>创建时间</FieldLabel>
            <Input
              id={`${idPrefix}-created-at`}
              defaultValue={new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(
                new Date(project.createdAt),
              )}
              disabled
            />
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor={`${idPrefix}-updated-at`}>更新时间</FieldLabel>
            <Input
              id={`${idPrefix}-updated-at`}
              defaultValue={new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(
                new Date(project.updatedAt),
              )}
              disabled
            />
          </Field>
        </FieldGroup>
      ) : null}
      {!state.ok ? (
        <Field>
          <FieldError aria-live="polite">{state.message}</FieldError>
        </Field>
      ) : null}
    </FieldGroup>
  );
}
