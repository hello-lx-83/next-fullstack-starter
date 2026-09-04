"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
import { isNavigationItemActive, SETTINGS_NAVIGATION } from "@/config/navigation";
import { useSettingsGuard } from "@/features/settings/settings-guard";

export function SettingsNavigation({ replace = false }: { replace?: boolean }) {
  const { requestLeave } = useSettingsGuard();
  const router = useRouter();
  const pathname = usePathname();
  const groups = SETTINGS_NAVIGATION;
  const currentItem = groups.flatMap((group) => group.items).find((item) => isNavigationItemActive(pathname, item));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between md:hidden" />}>
          <Settings2 data-icon="inline-start" />
          <span className="truncate">{currentItem?.title ?? "选择设置"}</span>
          <ChevronDown data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--anchor-width)" align="start">
          {groups.map((group, groupIndex) => (
            <div key={group.title}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuGroup>
                <DropdownMenuLabel>{group.title}</DropdownMenuLabel>
                {group.items.map((item) => (
                  <DropdownMenuItem
                    key={item.url}
                    render={
                      <Link
                        href={item.url}
                        replace={replace}
                        scroll={false}
                        onNavigate={(event) => {
                          event.preventDefault();
                          requestLeave(() =>
                            replace
                              ? router.replace(item.url, { scroll: false })
                              : router.push(item.url, { scroll: false }),
                          );
                        }}
                        aria-current={isNavigationItemActive(pathname, item) ? "page" : undefined}
                      />
                    }
                    nativeButton={false}
                  >
                    <item.icon />
                    {item.title}
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
                  className="w-full justify-start"
                  key={item.url}
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                  render={
                    <Link
                      href={item.url}
                      replace={replace}
                      scroll={false}
                      onNavigate={(event) => {
                        event.preventDefault();
                        requestLeave(() =>
                          replace
                            ? router.replace(item.url, { scroll: false })
                            : router.push(item.url, { scroll: false }),
                        );
                      }}
                      aria-current={isActive ? "page" : undefined}
                    />
                  }
                  nativeButton={false}
                  role="link"
                >
                  <item.icon data-icon="inline-start" />
                  {item.title}
                </Button>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}
