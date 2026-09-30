"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Leaf, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ShellNavItem = { href: string; label: string; match: string };

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  nav: ShellNavItem[];
  children: ReactNode;
};

export function PlatformShell({ title, subtitle, badge, nav, children }: Props) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const active = nav.filter((item) => pathname === item.match || pathname.startsWith(`${item.match}/`)).sort((a, b) => b.match.length - a.match.length)[0];
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Leaf className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-serif text-base font-bold leading-tight">
                Đồng xanh <span className="font-sans text-sm font-semibold text-[var(--muted-foreground)]">· {title}</span>
              </p>
              {subtitle && <p className="truncate text-xs text-[var(--muted-foreground)]">{subtitle}</p>}
            </div>
            {badge && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {badge}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="touch"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
        <nav aria-label={title} className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              aria-current={active === item ? "page" : undefined}
              className={cn(
                "flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors",
                active === item
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
