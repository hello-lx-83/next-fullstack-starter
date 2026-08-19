"use client";

import { useTransition } from "react";

import { Laptop, ShieldCheck } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { revokeSessionAction } from "@/features/sessions/actions";
import type { SessionDto } from "@/server/dal/sessions";

interface SessionListProps {
  sessions: SessionDto[];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

function RevokeSessionButton({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();

  function revoke() {
    startTransition(async () => {
      const result = await revokeSessionAction(sessionId);
      if (result.ok) toast.success("会话已撤销");
      else toast.error(result.message);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          撤销
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>撤销这个登录会话？</AlertDialogTitle>
          <AlertDialogDescription>该设备将需要重新登录。此操作不会影响当前设备。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={revoke} variant="destructive">
            {pending ? <Spinner data-icon="inline-start" /> : null}
            确认撤销
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SessionList({ sessions }: SessionListProps) {
  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4" key={session.id}>
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-md bg-muted p-2">
              {session.current ? <ShieldCheck className="size-5" /> : <Laptop className="size-5" />}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{session.device}</span>
                {session.current ? <Badge>当前会话</Badge> : null}
              </div>
              <span className="text-muted-foreground text-sm">最近活动：{formatDate(session.updatedAt)}</span>
              <span className="text-muted-foreground text-xs">到期时间：{formatDate(session.expiresAt)}</span>
            </div>
          </div>
          {session.current ? null : <RevokeSessionButton sessionId={session.id} />}
        </div>
      ))}
    </div>
  );
}
