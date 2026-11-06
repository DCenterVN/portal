"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Circle, LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { isActive, type NavGroup } from "@/lib/navigation";

type User = { name: string; detail?: string };

type Props = {
  pathname: string;
  nav: NavGroup[];
  context: { label: string; sublabel?: string };
  user: User;
  accountHref?: string;
  /** The logout item shows only when the frame can log out. */
  onLogout?: () => void;
};

function UserSummary({ user }: { user: User }) {
  return (
    <>
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg bg-muted font-medium text-muted-foreground">{user.name.trim().charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {user.detail && <span className="truncate text-xs text-muted-foreground">{user.detail}</span>}
      </div>
    </>
  );
}

function NavUser({ user, accountHref = "/account", onLogout }: Pick<Props, "user" | "accountHref" | "onLogout">) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" aria-label={`Tài khoản của ${user.name}`} className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <UserSummary user={user} />
              <ChevronsUpDown className="ml-auto size-4" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <UserSummary user={user} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push(accountHref as Route)}>
              <UserRound aria-hidden="true" />
              Tài khoản
            </DropdownMenuItem>
            {onLogout && (
              <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                <LogOut aria-hidden="true" />
                Đăng xuất
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function ConsoleSidebar({ pathname, nav, context, user, accountHref, onLogout }: Props) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={context.label} className="cursor-default hover:bg-transparent active:bg-transparent">
              <div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">{context.label}</span>
                  {context.sublabel && context.sublabel.trim().toLowerCase() !== context.label.trim().toLowerCase() && <span className="truncate text-xs text-muted-foreground">{context.sublabel}</span>}
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Điều hướng quản trị" className="contents">
          {nav.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.match);
                  const Icon = item.icon ?? Circle;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="[&>svg]:text-muted-foreground data-[active=true]:[&>svg]:text-sidebar-accent-foreground">
                        <Link href={item.href as Route} aria-current={active ? "page" : undefined}>
                          <Icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} accountHref={accountHref} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
