"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ChevronUp, FolderKanban, LogOut, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { isNavigationItemActive, WORKSPACE_NAVIGATION } from "@/config/navigation";
import { getInitials } from "@/lib/utils";
import { authClient } from "@/server/auth/client";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function AppSidebar({ user, isAdmin }: { user: { name: string; email: string }; isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { sidebarCollapsible, sidebarVariant } = usePreferencesStore(
    useShallow((state) => ({
      sidebarCollapsible: state.values.sidebar_collapsible,
      sidebarVariant: state.values.sidebar_variant,
    })),
  );

  function closeMobileNavigation() {
    if (isMobile) setOpenMobile(false);
  }

  async function signOut() {
    closeMobileNavigation();
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Sidebar collapsible={sidebarCollapsible} variant={sidebarVariant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/dashboard">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FolderKanban />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{APP_CONFIG.name}</span>
                  <span className="truncate text-xs">本地全栈工具模板</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>工作区</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {WORKSPACE_NAVIGATION.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isNavigationItemActive(pathname, item)}>
                    <Link href={item.url} onClick={closeMobileNavigation}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" aria-label="打开账户菜单">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-muted-foreground text-xs">{user.email}</span>
                  </div>
                  <ChevronUp />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="end" className="w-64">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="truncate">{user.name}</span>
                  <span className="truncate">
                    {user.email} · {isAdmin ? "管理员" : "普通用户"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings/profile" onClick={closeMobileNavigation}>
                      <Settings />
                      设置
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={signOut}>
                    <LogOut />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
