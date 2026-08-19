import type { LucideIcon } from "lucide-react";
import {
  FolderKanban,
  House,
  Info,
  KeyRound,
  Palette,
  UserRound,
  UsersRound,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
}

export interface NavigationGroup {
  title: string;
  items: readonly NavigationItem[];
}

export interface BreadcrumbItem {
  title: string;
  url?: string;
}

export const WORKSPACE_NAVIGATION: readonly NavigationItem[] = [
  { title: "首页", url: "/dashboard", icon: House, exact: true },
  { title: "项目", url: "/dashboard/projects", icon: FolderKanban },
];

export const SETTINGS_NAVIGATION: readonly NavigationGroup[] = [
  {
    title: "个人",
    items: [
      { title: "个人资料", url: "/dashboard/settings/profile", icon: UserRound },
      { title: "安全", url: "/dashboard/settings/security", icon: KeyRound },
      { title: "外观", url: "/dashboard/settings/appearance", icon: Palette },
    ],
  },
  {
    title: "管理",
    items: [{ title: "用户", url: "/dashboard/settings/users", icon: UsersRound, adminOnly: true }],
  },
  {
    title: "系统",
    items: [{ title: "关于", url: "/dashboard/settings/about", icon: Info }],
  },
];

export function isNavigationItemActive(pathname: string, item: Pick<NavigationItem, "url" | "exact">) {
  return item.exact ? pathname === item.url : pathname === item.url || pathname.startsWith(`${item.url}/`);
}

export function getVisibleSettingsNavigation(isAdmin: boolean): NavigationGroup[] {
  return SETTINGS_NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((group) => group.items.length > 0);
}

export function getDashboardBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/dashboard") return [{ title: "首页" }];
  if (pathname === "/dashboard/projects" || pathname.startsWith("/dashboard/projects/")) {
    if (pathname === "/dashboard/projects") return [{ title: "项目" }];
    if (pathname === "/dashboard/projects/new") {
      return [{ title: "项目", url: "/dashboard/projects" }, { title: "新建" }];
    }
    return [{ title: "项目", url: "/dashboard/projects" }, { title: pathname.endsWith("/edit") ? "编辑" : "详情" }];
  }

  if (pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")) {
    const settingsItem = SETTINGS_NAVIGATION.flatMap((group) => group.items).find((item) =>
      isNavigationItemActive(pathname, item),
    );

    return [
      { title: "设置", url: "/dashboard/settings/profile" },
      ...(settingsItem ? [{ title: settingsItem.title }] : []),
    ];
  }

  return [{ title: "工作区" }];
}
