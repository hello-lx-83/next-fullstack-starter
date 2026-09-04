"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";

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
import { toast } from "@/components/ui/toast";

type FormStatus = { dirty: boolean; pending: boolean };
const SettingsGuardContext = createContext<{
  setFormStatus: (status: FormStatus) => void;
  requestLeave: (navigate: () => void) => void;
}>({
  setFormStatus: (_status: FormStatus) => undefined,
  requestLeave: (navigate: () => void) => navigate(),
});

export const useSettingsGuard = () => useContext(SettingsGuardContext);

export function useSettingsFormGuard(dirty: boolean, pending: boolean) {
  const { setFormStatus } = useSettingsGuard();
  useEffect(() => {
    setFormStatus({ dirty, pending });
  }, [dirty, pending, setFormStatus]);
  useEffect(() => () => setFormStatus({ dirty: false, pending: false }), [setFormStatus]);
}

export function SettingsGuard({ children }: { children: ReactNode }) {
  const [status, setFormStatus] = useState<FormStatus>({ dirty: false, pending: false });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigation = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!status.dirty && !status.pending) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [status]);

  function requestLeave(navigate: () => void) {
    if (status.pending) {
      toast.add({ type: "info", title: "正在保存，请稍候" });
    } else if (status.dirty) {
      navigation.current = navigate;
      setConfirmOpen(true);
    } else {
      navigate();
    }
  }

  return (
    <SettingsGuardContext value={{ setFormStatus, requestLeave }}>
      {children}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>放弃未保存的修改？</AlertDialogTitle>
            <AlertDialogDescription>离开后，本次填写的内容不会保存。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续编辑</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setFormStatus({ dirty: false, pending: false });
                setConfirmOpen(false);
                navigation.current?.();
                navigation.current = null;
              }}
            >
              放弃修改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsGuardContext>
  );
}
