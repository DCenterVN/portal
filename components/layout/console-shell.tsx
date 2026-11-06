"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { breadcrumbFor, type NavGroup } from "@/lib/navigation";
import { ConsoleHeader } from "./console-header";
import { ConsoleSidebar } from "./console-sidebar";

export type { NavGroup, NavItem } from "@/lib/navigation";

type Props = {
  nav: NavGroup[];
  context: { label: string; sublabel?: string };
  user: { name: string; detail?: string };
  accountHref?: string;
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
      <ConsoleSidebar pathname={pathname} nav={nav} context={context} user={user} accountHref={accountHref} onLogout={onLogout} />
      <SidebarInset className="min-w-0">
        <ConsoleHeader crumbs={breadcrumbFor(nav, pathname)} actions={actions} />
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
