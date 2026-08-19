"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronDown, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getVisibleSettingsNavigation, isNavigationItemActive } from "@/config/navigation";

export function SettingsNavigation({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const groups = getVisibleSettingsNavigation(isAdmin);
  const currentItem = groups.flatMap((group) => group.items).find((item) => isNavigationItemActive(pathname, item));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between md:hidden">
            <Settings2 data-icon="inline-start" />
            <span className="truncate">{currentItem?.title ?? "选择设置"}</span>
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)" align="start">
          {groups.map((group, groupIndex) => (
            <div key={group.title}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuGroup>
                <DropdownMenuLabel>{group.title}</DropdownMenuLabel>
                {group.items.map((item) => (
                  <DropdownMenuItem key={item.url} asChild>
                    <Link href={item.url} aria-current={isNavigationItemActive(pathname, item) ? "page" : undefined}>
                      <item.icon />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="hidden flex-col gap-5 md:flex" aria-label="设置导航">
        {groups.map((group) => (
          <div className="flex flex-col gap-1" key={group.title}>
            <p className="px-2 font-medium text-muted-foreground text-xs">{group.title}</p>
            {group.items.map((item) => {
              const isActive = isNavigationItemActive(pathname, item);

              return (
                <Button
                  asChild
                  className="w-full justify-start"
                  key={item.url}
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                >
                  <Link href={item.url} aria-current={isActive ? "page" : undefined}>
                    <item.icon data-icon="inline-start" />
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}
