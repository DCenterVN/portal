"use client";

import { useState, type ReactNode } from "react";

export interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
  title?: string;
  headerActions?: ReactNode;
}

export function AppShell({
  sidebar,
  children,
  title = "Việt Sạch",
  headerActions,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)] text-[var(--color-ink)]">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-drawer bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar for Desktop and Mobile Drawer */}
      <aside
        className={`z-sidebar border-r border-[var(--color-line)] bg-[var(--color-panel)] transition-all duration-200 fixed inset-y-0 left-0 md:static ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-16" : "md:w-64"} w-64 flex flex-col`}
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--color-line)] px-4">
          <span className={`font-serif font-bold text-[var(--color-teal)] truncate ${collapsed ? "hidden md:hidden" : "block"}`}>
            Quản trị
          </span>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-panel-strong)] hover:text-[var(--color-ink)]"
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {collapsed ? "→" : "←"}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-panel-strong)]"
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{sidebar}</div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="z-header sticky top-0 flex h-14 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-panel)]/80 px-4 md:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-ink)]"
              aria-label="Mở menu điều hướng"
            >
              ☰
            </button>
            <span className="font-serif text-lg font-semibold truncate">{title}</span>
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
