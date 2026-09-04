"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { changePasswordAction, updateProfileAction } from "@/features/profile/actions";
import { useSettingsFormGuard } from "@/features/settings/settings-guard";
import type { ActionResult } from "@/lib/action-result";

type ProfileActionResult = ActionResult<{ message: string }>;

const initialState: ProfileActionResult = { ok: true };

function ResultMessage({ state }: { state: ProfileActionResult }) {
  if (state.ok) return null;
  return <FieldError aria-live="polite">{state.message}</FieldError>;
}

function formatErrors(errors: string[] | undefined) {
  return errors?.map((message) => ({ message }));
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [dirty, setDirty] = useState(false);
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  useSettingsFormGuard(dirty, pending);
  const fieldErrors = state.ok ? undefined : state.fieldErrors;
  const nameInvalid = Boolean(fieldErrors?.name?.length);

  useEffect(() => {
    if (state.ok && state.data) {
      setDirty(false);
      toast.add({ type: "success", title: state.data.message });
    }
  }, [state]);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={nameInvalid}>
          <FieldLabel htmlFor="profile-name">姓名</FieldLabel>
          <Input
            id="profile-name"
            name="name"
            defaultValue={name}
            onChange={(event) => setDirty(event.target.value !== name)}
            autoComplete="name"
            aria-invalid={nameInvalid}
            required
          />
          <FieldError errors={formatErrors(fieldErrors?.name)} />
        </Field>
        <Field data-disabled>
          <FieldLabel htmlFor="profile-email">邮箱</FieldLabel>
          <Input id="profile-email" value={email} autoComplete="email" disabled />
          <FieldDescription>邮箱与登录账号绑定，由管理员维护。</FieldDescription>
        </Field>
      </FieldGroup>
      <ResultMessage state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          保存资料
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
  useSettingsFormGuard(dirty, pending);
  const fieldErrors = state.ok ? undefined : state.fieldErrors;
  const currentPasswordInvalid = Boolean(fieldErrors?.currentPassword?.length);
  const newPasswordInvalid = Boolean(fieldErrors?.newPassword?.length);
  const confirmPasswordInvalid = Boolean(fieldErrors?.confirmPassword?.length);

  useEffect(() => {
    if (state.ok && state.data) {
      formRef.current?.reset();
      setDirty(false);
      toast.add({ type: "success", title: state.data.message });
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      onChange={() =>
        setDirty(Array.from(formRef.current?.querySelectorAll("input") ?? []).some((input) => input.value !== ""))
      }
      action={action}
      className="flex max-w-xl flex-col gap-6"
    >
      <FieldGroup>
        <Field data-invalid={currentPasswordInvalid}>
          <FieldLabel htmlFor="current-password">当前密码</FieldLabel>
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-invalid={currentPasswordInvalid}
            required
          />
          <FieldError errors={formatErrors(fieldErrors?.currentPassword)} />
        </Field>
        <Field data-invalid={newPasswordInvalid}>
          <FieldLabel htmlFor="new-password">新密码</FieldLabel>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            minLength={8}
            autoComplete="new-password"
            aria-invalid={newPasswordInvalid}
            required
          />
          <FieldDescription>至少 8 个字符，建议使用只在本工具中使用的独立密码。</FieldDescription>
          <FieldError errors={formatErrors(fieldErrors?.newPassword)} />
        </Field>
        <Field data-invalid={confirmPasswordInvalid}>
          <FieldLabel htmlFor="confirm-password">确认新密码</FieldLabel>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            minLength={8}
            autoComplete="new-password"
            aria-invalid={confirmPasswordInvalid}
            required
          />
          <FieldError errors={formatErrors(fieldErrors?.confirmPassword)} />
        </Field>
      </FieldGroup>
      <ResultMessage state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          修改密码
        </Button>
      </div>
    </form>
  );
}
