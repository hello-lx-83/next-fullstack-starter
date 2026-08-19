import type { ReactNode } from "react";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { MotionProvider } from "@/components/shared/motion-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isAdmin } from "@/server/auth/permissions";
import { requireUser } from "@/server/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();
  return (
    <SidebarProvider>
      <AppSidebar user={{ name: session.user.name, email: session.user.email }} isAdmin={isAdmin(session.user.role)} />
      <SidebarInset>
        <DashboardHeader />
        <MotionProvider>
          <main className="flex w-full flex-1 flex-col gap-6 p-4 md:p-6 [html[data-content-layout=centered]_&]:mx-auto [html[data-content-layout=centered]_&]:max-w-7xl">
            {children}
          </main>
        </MotionProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
