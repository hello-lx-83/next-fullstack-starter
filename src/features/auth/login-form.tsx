"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/server/auth/client";

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(event.currentTarget);

    try {
      const result = await authClient.signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        rememberMe: formData.get("remember") === "on",
      });
      if (result.error) {
        setError("邮箱或密码不正确，请重试");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("登录服务暂时不可用，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} aria-busy={pending}>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-bold font-heading text-2xl">登录工作台</h1>
        <p className="text-balance text-muted-foreground text-sm">使用管理员创建的账号继续</p>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="email">邮箱</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@example.com"
            aria-invalid={Boolean(error)}
            required
          />
        </Field>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="password">密码</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(error)}
            required
          />
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="remember" name="remember" />
          <FieldLabel htmlFor="remember" className="font-normal">
            保持登录
          </FieldLabel>
        </Field>
        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" aria-label="正在登录" /> : null}
            {pending ? "正在登录" : "登录"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
