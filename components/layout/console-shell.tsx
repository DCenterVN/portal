"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { breadcrumbFor, type NavGroup } from "@/lib/navigation";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { ConsoleHeader } from "./console-header";
import type { BranchSwitch } from "./branch-switcher";
import { ConsoleSidebar } from "./console-sidebar";

export type { NavGroup, NavItem } from "@/lib/navigation";

type Props = {
  nav: NavGroup[];
  context: { label: string; sublabel?: string };
  user: { name: string; detail?: string };
  accountHref?: string;
  branchSwitch?: BranchSwitch;
  onLogout?: () => void;
  statusText?: string;
  children: ReactNode;
  actions?: ReactNode;
  skipLinkLabel?: string;
};

export function ConsoleShell({
  nav,
  context,
  user,
  accountHref,
  branchSwitch,
  onLogout,
  statusText,
  children,
  actions,
  skipLinkLabel = "Bỏ qua tới nội dung",
}: Props) {
  const pathname = usePathname() ?? "";
  return (
    <SidebarProvider data-surface="console">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-(--z-toast) focus:rounded-md focus:bg-background focus:px-4 focus:py-2" href="#main">
        {skipLinkLabel}
      </a>
      <ConsoleSidebar pathname={pathname} nav={nav} context={context} user={user} accountHref={accountHref} branchSwitch={branchSwitch} onLogout={onLogout} />
      <SidebarInset className="min-w-0">
        <ConsoleHeader crumbs={breadcrumbFor(nav, pathname)} actions={actions} />
        {branchSwitch?.branch.status === "SUSPENDED" && (
          <div className="px-4 pt-4 md:px-6">
            <InlineAlert tone="warning">Chi nhánh đang tạm ngừng: chỉ xử lý đơn đang có</InlineAlert>
          </div>
        )}
        <main id="main" className="w-full flex-1 p-4 md:p-6">
          {children}
        </main>
        {statusText && (
          <footer className="flex min-h-11 items-center border-t border-border px-4 text-xs text-muted-foreground md:px-6">
            <span>{statusText}</span>
          </footer>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
