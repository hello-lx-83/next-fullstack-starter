"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { Ban, KeyRound, Plus, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createUserAction,
  deleteUserAction,
  resetUserPasswordAction,
  setUserBannedAction,
} from "@/features/users/actions";
import type { ActionResult } from "@/lib/action-result";
import type { UserDto } from "@/server/dal/users";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createUserAction, { ok: true } as ActionResult<{ id: string }>);
  useEffect(() => {
    if (state.ok && state.data) {
      setOpen(false);
      toast.success("用户已创建");
    }
  }, [state]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          创建用户
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          <DialogHeader>
            <DialogTitle>创建本地用户</DialogTitle>
            <DialogDescription>为用户设置初始密码；本模板不会发送邮件。</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-3">
            <Field data-invalid={!state.ok && Boolean(state.fieldErrors?.name)}>
              <FieldLabel htmlFor="user-name">姓名</FieldLabel>
              <Input id="user-name" name="name" required aria-invalid={!state.ok && Boolean(state.fieldErrors?.name)} />
              {!state.ok ? <FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} /> : null}
            </Field>
            <Field data-invalid={!state.ok && Boolean(state.fieldErrors?.email)}>
              <FieldLabel htmlFor="user-email">邮箱</FieldLabel>
              <Input
                id="user-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={!state.ok && Boolean(state.fieldErrors?.email)}
              />
              {!state.ok ? <FieldError errors={state.fieldErrors?.email?.map((message) => ({ message }))} /> : null}
            </Field>
            <Field data-invalid={!state.ok && Boolean(state.fieldErrors?.password)}>
              <FieldLabel htmlFor="user-password">初始密码</FieldLabel>
              <Input
                id="user-password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
                aria-invalid={!state.ok && Boolean(state.fieldErrors?.password)}
              />
              {!state.ok ? <FieldError errors={state.fieldErrors?.password?.map((message) => ({ message }))} /> : null}
            </Field>
            <FieldDescription>新账号固定为普通用户；超级管理员由初始化命令维护。</FieldDescription>
            {!state.ok ? <FieldError>{state.message}</FieldError> : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user }: { user: UserDto }) {
  const [open, setOpen] = useState(false);
  const boundAction = resetUserPasswordAction.bind(null, user.id);
  const [state, action, pending] = useActionState(boundAction, { ok: true } as ActionResult<{ reset: true }>);

  useEffect(() => {
    if (state.ok && state.data?.reset) {
      setOpen(false);
      toast.success("密码已重置，用户的所有会话已撤销");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <KeyRound data-icon="inline-start" />
          重置密码
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action}>
          <DialogHeader>
            <DialogTitle>重置“{user.name}”的密码</DialogTitle>
            <DialogDescription>设置临时密码后，该用户的所有现有会话都会被撤销。</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-3">
            <Field data-invalid={!state.ok && Boolean(state.fieldErrors?.newPassword)}>
              <FieldLabel htmlFor={`reset-password-${user.id}`}>新密码</FieldLabel>
              <Input
                id={`reset-password-${user.id}`}
                name="newPassword"
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
                aria-invalid={!state.ok && Boolean(state.fieldErrors?.newPassword)}
              />
              {!state.ok ? (
                <FieldError errors={state.fieldErrors?.newPassword?.map((message) => ({ message }))} />
              ) : null}
            </Field>
            <Field data-invalid={!state.ok && Boolean(state.fieldErrors?.confirmPassword)}>
              <FieldLabel htmlFor={`confirm-password-${user.id}`}>确认新密码</FieldLabel>
              <Input
                id={`confirm-password-${user.id}`}
                name="confirmPassword"
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
                aria-invalid={!state.ok && Boolean(state.fieldErrors?.confirmPassword)}
              />
              {!state.ok ? (
                <FieldError errors={state.fieldErrors?.confirmPassword?.map((message) => ({ message }))} />
              ) : null}
            </Field>
            {!state.ok ? <FieldError>{state.message}</FieldError> : null}
          </FieldGroup>
          <DialogFooter>
            <Button disabled={pending} type="submit">
              {pending ? <Spinner data-icon="inline-start" /> : null}
              重置并撤销会话
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserActions({ user, currentUserId }: { user: UserDto; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const self = user.id === currentUserId;
  const protectedUser = self || user.role === "admin";
  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      try {
        const result = await action();
        result.ok ? toast.success(success) : toast.error(result.message);
      } catch {
        toast.error("用户操作失败，请稍后重试");
      }
    });
  }
  const statusAction = user.banned ? (
    <Button
      variant="outline"
      size="sm"
      disabled={pending || protectedUser}
      onClick={() => run(() => setUserBannedAction(user.id, false), "用户已启用")}
    >
      <Ban />
      启用
    </Button>
  ) : (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending || protectedUser}>
          <Ban />
          停用
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>停用“{user.name}”？</AlertDialogTitle>
          <AlertDialogDescription>该用户的现有会话会立即撤销，在重新启用前无法登录。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => run(() => setUserBannedAction(user.id, true), "用户已停用")}
          >
            确认停用
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {protectedUser ? null : <ResetPasswordDialog user={user} />}
      {statusAction}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending || protectedUser}>
            <Trash2 />
            删除
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>永久删除“{user.name}”？</AlertDialogTitle>
            <AlertDialogDescription>
              该用户的账号、会话和所有项目都会被永久删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => run(() => deleteUserAction(user.id), "用户已删除")}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function UserTable({ users, currentUserId }: { users: UserDto[]; currentUserId: string }) {
  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <p className="font-medium">{user.name}</p>
                <p className="text-muted-foreground text-xs">{user.email}</p>
              </TableCell>
              <TableCell>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role === "admin" ? "管理员" : "普通用户"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.banned ? "destructive" : "outline"}>{user.banned ? "已停用" : "正常"}</Badge>
              </TableCell>
              <TableCell>
                {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(user.createdAt))}
              </TableCell>
              <TableCell className="text-right">
                <UserActions user={user} currentUserId={currentUserId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
