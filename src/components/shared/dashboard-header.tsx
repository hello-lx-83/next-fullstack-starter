"use client";

import { Fragment } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getDashboardBreadcrumbs } from "@/config/navigation";

export function DashboardHeader() {
  const pathname = usePathname();
  const breadcrumbs = getDashboardBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-md [html[data-navbar-style=scroll]_&]:static">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger aria-label="切换导航" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isCurrent = index === breadcrumbs.length - 1;

              return (
                <Fragment key={`${item.url ?? "current"}-${item.title}`}>
                  <BreadcrumbItem className={isCurrent ? undefined : "hidden sm:inline-flex"}>
                    {item.url && !isCurrent ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.url}>{item.title}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.title}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {!isCurrent && <BreadcrumbSeparator className="hidden sm:list-item" />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <ThemeSwitcher />
    </header>
  );
}
