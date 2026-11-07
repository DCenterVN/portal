"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { useHeaderProfile } from "@/lib/use-header-profile";
import type { NavGroup } from "@/lib/navigation";
import { BranchSwitcher, type BranchSwitch } from "./branch-switcher";
import { ConsoleNav } from "./console-nav";

type User = { name: string; detail?: string; avatar_url?: string | null };

type Props = {
  pathname: string;
  nav: NavGroup[];
  context: { label: string; sublabel?: string };
  user: User;
  accountHref?: string;
  branchSwitch?: BranchSwitch;
  /** The logout item shows only when the frame can log out. */
  onLogout?: () => void;
};

function UserSummary({ user }: { user: User }) {
  return (
    <>
      <Avatar className="size-8">
        <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
        <AvatarFallback className="bg-muted font-medium text-muted-foreground">{user.name.trim().charAt(0).toUpperCase()}</AvatarFallback>
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
  user = useHeaderProfile(user);
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

export function ConsoleSidebar({ pathname, nav, context, user, accountHref, branchSwitch, onLogout }: Props) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {branchSwitch ? <BranchSwitcher {...branchSwitch} /> : (
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
        )}
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Điều hướng quản trị" className="contents">
          <ConsoleNav nav={nav} pathname={pathname} />
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} accountHref={accountHref} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
