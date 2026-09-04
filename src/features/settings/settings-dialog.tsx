"use client";

import { type ReactNode, useId } from "react";

import { useRouter } from "next/navigation";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SettingsGuard, useSettingsGuard } from "@/features/settings/settings-guard";
import { SettingsNavigation } from "@/features/settings/settings-navigation";

function SettingsDialogContent({ children }: { children: ReactNode }) {
  const titleId = useId();
  const router = useRouter();
  const { requestLeave } = useSettingsGuard();
  const close = () => requestLeave(() => router.back());

  return (
    <Dialog
      open
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        aria-labelledby={titleId}
        showCloseButton={false}
        className="flex h-dvh max-h-dvh w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[min(42rem,85dvh)] sm:max-w-[min(55rem,calc(100%-3rem))] sm:rounded-xl"
        finalFocus={() => document.querySelector<HTMLButtonElement>('[aria-label="打开账户菜单"]')}
      >
        <DialogHeader className="flex-row items-center justify-between border-b px-5 py-4">
          <DialogTitle id={titleId}>设置</DialogTitle>
          <Button variant="ghost" size="icon-sm" aria-label="关闭设置" onClick={close}>
            <X />
          </Button>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="shrink-0 border-b p-4 md:w-44 md:overflow-y-auto md:border-r md:border-b-0">
            <SettingsNavigation replace />
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            <div className="flex min-w-0 flex-col gap-6">{children}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsDialog({ children }: { children: ReactNode }) {
  return (
    <SettingsGuard>
      <SettingsDialogContent>{children}</SettingsDialogContent>
    </SettingsGuard>
  );
}
