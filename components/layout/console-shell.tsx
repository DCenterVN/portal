"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Leaf } from "lucide-react";
import { ConsoleHeader } from "./console-header";
import { ConsoleSidebar } from "./console-sidebar";

export type ShellNavItem = { href: string; label: string; match: string; icon?: LucideIcon };
export type ShellNavGroup = { title: string; items: ShellNavItem[] };

type Props = {
  nav: ShellNavGroup[];
  context: { label: string; sublabel?: string };
  user: { name: string; detail?: string };
  accountHref?: string;
  onLogout?: () => void;
  statusText?: string;
  children: ReactNode;
  actions?: ReactNode;
  skipLinkLabel?: string;
  toggleLabel?: string;
  defaultCollapsed?: boolean;
};

const STORAGE_KEY = "console.sidebar.collapsed";

export function initialCollapsed(width: number, stored: string | null): boolean {
  if (stored === "1") return true;
  if (stored === "0") return false;
  return width < 1024;
}

export function isActive(pathname: string, match: string): boolean {
  return pathname === match || pathname.startsWith(`${match}/`);
}

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
  toggleLabel = "Toggle sidebar",
  defaultCollapsed = false,
}: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    setCollapsed(initialCollapsed(window.innerWidth, stored));
  }, []);

  const toggleCollapsed = () => {
    const nextCollapsed = !collapsed;
    setCollapsed(nextCollapsed);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextCollapsed ? "1" : "0");
    } catch {
      // The layout remains usable when storage is unavailable.
    }
  };

  return (
    <div
      data-surface="console"
      data-collapsed={collapsed || undefined}
      className="grid min-h-screen grid-cols-[auto_minmax(0,1fr)] bg-[var(--background)] text-[var(--foreground)]"
    >
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-(--z-toast) focus:rounded-md focus:bg-[var(--surface)] focus:px-4 focus:py-2" href="#main">
        {skipLinkLabel}
      </a>
      <ConsoleSidebar
        id="console-sidebar"
        collapsed={collapsed}
        pathname={pathname}
        nav={nav}
        context={context}
        logo={<Leaf className="size-5" aria-hidden="true" />}
      />
      <div className="flex min-w-0 flex-col">
        <ConsoleHeader
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          toggleLabel={toggleLabel}
          user={user}
          accountHref={accountHref}
          onLogout={onLogout}
          actions={actions}
        />
        <main id="main" className="w-full flex-1 p-6">
          {children}
        </main>
        {statusText && (
          <footer className="flex min-h-11 items-center gap-2 border-t border-[var(--border)] px-4 text-xs text-[var(--muted-foreground)] md:px-6">
            <span className="size-2 animate-pulse rounded-full bg-[var(--color-leaf)] motion-reduce:animate-none" aria-hidden="true" />
            <span>{statusText}</span>
          </footer>
        )}
      </div>
    </div>
  );
}
