"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col selection:bg-emerald-500/20">
      {/* Ambient background glow for Dark mode */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(45, 90, 39, 0.15), transparent 70%), radial-gradient(ellipse 40% 30% at 85% 85%, rgba(16, 185, 129, 0.08), transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Top Header */}
      <Header />

      {/* Body Area with Sidebar + Content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        <main className={cn("flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
