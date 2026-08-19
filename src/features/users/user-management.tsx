"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { Ban, LoaderCircle, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createUserAction, setUserBannedAction } from "@/features/users/actions";
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
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="user-name">姓名</Label>
              <Input id="user-name" name="name" required />
              {!state.ok &&
                state.fieldErrors?.name?.map((e) => (
                  <p className="text-destructive text-xs" key={e}>
                    {e}
                  </p>
                ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">邮箱</Label>
              <Input id="user-email" name="email" type="email" required />
              {!state.ok &&
                state.fieldErrors?.email?.map((e) => (
                  <p className="text-destructive text-xs" key={e}>
                    {e}
                  </p>
                ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">初始密码</Label>
              <Input id="user-password" name="password" type="password" minLength={8} required />
              {!state.ok &&
                state.fieldErrors?.password?.map((e) => (
                  <p className="text-destructive text-xs" key={e}>
                    {e}
                  </p>
                ))}
            </div>
            <p className="text-muted-foreground text-sm">新账号固定为普通用户；超级管理员由初始化命令维护。</p>
            {!state.ok && <p className="text-destructive text-sm">{state.message}</p>}
          </div>
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

function UserActions({ user, currentUserId }: { user: UserDto; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const self = user.id === currentUserId;
  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      try {
        const result = await action();
        result.ok ? toast.success(success) : toast.error(result.message);
      } catch {
        toast.error("更新用户状态失败，请稍后重试");
      }
    });
  }
  if (user.banned) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending || self}
        onClick={() => run(() => setUserBannedAction(user.id, false), "用户已启用")}
      >
        <Ban />
        启用
      </Button>
    );
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending || self}>
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
