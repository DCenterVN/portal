"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  Building2,
  Users,
  ShieldCheck,
  Snowflake,
  ChevronsUpDown,
  Check,
  Sun,
  Moon,
  LogOut,
  Store,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export interface BranchInfo {
  id: string;
  code: string;
  name: string;
  address: string;
  status: "active" | "suspended" | "closed";
  type: "MAIN" | "BRANCH";
  membersCount: number;
  tempZone: string;
}

export const DEFAULT_FALLBACK_BRANCH: BranchInfo = {
  id: "br-fallback",
  code: "CN-HCM-01",
  name: "Chi nhánh Quận 7 — Kho Lạnh Tân Thuận",
  address: "Khu Chế Xuất Tân Thuận, P. Tân Thuận Đông, Q.7, TP.HCM",
  status: "active",
  type: "MAIN",
  membersCount: 14,
  tempZone: "-18°C ~ -25°C",
};

export const SAMPLE_BRANCHES: BranchInfo[] = [
  {
    id: "br-01-q7",
    code: "CN-HCM-01",
    name: "Chi nhánh Quận 7 — Kho Lạnh Tân Thuận",
    address: "Khu Chế Xuất Tân Thuận, P. Tân Thuận Đông, Q.7, TP.HCM",
    status: "active",
    type: "MAIN",
    membersCount: 14,
    tempZone: "-18°C ~ -25°C",
  },
  {
    id: "br-02-tb",
    code: "CN-HCM-02",
    name: "Chi nhánh Tân Bình — Trung Tâm Phân Phối",
    address: "120 Cộng Hòa, P. 12, Q. Tân Bình, TP.HCM",
    status: "active",
    type: "BRANCH",
    membersCount: 8,
    tempZone: "-18°C ~ -22°C",
  },
  {
    id: "br-03-hn",
    code: "CN-HN-01",
    name: "Chi nhánh Hà Nội — Kho Long Biên",
    address: "KCN Đài Tư, 386 Nguyễn Văn Linh, Q. Long Biên, Hà Nội",
    status: "active",
    type: "BRANCH",
    membersCount: 11,
    tempZone: "-20°C ~ -28°C",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Guard array access with fallback
  const initialBranch = SAMPLE_BRANCHES.length > 0 ? SAMPLE_BRANCHES[0] : DEFAULT_FALLBACK_BRANCH;
  const [selectedBranch, setSelectedBranch] = useState<BranchInfo>(initialBranch);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (pathname === "/") {
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold text-[var(--foreground)]">
            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            Việt Sạch
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium lg:flex" aria-label="Điều hướng chính">
            <Link href="/products" className="hover:text-[var(--primary)]">Sản phẩm</Link>
            <a href="#truy-xuat" className="hover:text-[var(--primary)]">Truy xuất nguồn gốc</a>
            <a href="#paths-title" className="hover:text-[var(--primary)]">Dành cho ai</a>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--border)]" aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link href="/login" className="hidden px-3 py-2 text-sm font-semibold sm:inline-flex">Đăng nhập</Link>
            <Link href="/products" className="inline-flex min-h-10 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]">Khám phá</Link>
          </div>
        </div>
      </header>
    );
  }

  // Hide top navigation on standalone auth/switch routes for clean focus
  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/activate",
    "/switch-branch",
    "/switch-org",
  ];
  if (authRoutes.includes(pathname)) {
    return null;
  }

  const navItems: Array<{
    label: string;
    href: "/branches" | "/products" | "/cart" | "/memberships" | "/roles";
    icon: typeof Building2;
  }> = [
    {
      label: "Chi nhánh",
      href: "/branches",
      icon: Building2,
    },
    {
      label: "Sản phẩm",
      href: "/products",
      icon: Store,
    },
    {
      label: "Thành viên",
      href: "/memberships",
      icon: Users,
    },
    {
      label: "Phân quyền",
      href: "/roles",
      icon: ShieldCheck,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand + Branch Switcher */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-sm text-[var(--foreground)] tracking-tight group">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform border border-emerald-400/30">
              <Snowflake className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs tracking-wider uppercase font-serif">Việt Sạch</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Chuỗi Lạnh -18°C
                </span>
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] font-medium">Cổng Vận Hành Doanh Nghiệp</span>
            </div>
          </Link>

          <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />

          {/* Branch Switcher Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-auto items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors shadow-xs"
            >
              <Store className="size-3.5 text-[var(--primary)]" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-xs leading-none">{selectedBranch.code}</span>
                <span className="text-[11px] text-[var(--muted-foreground)] truncate max-w-[160px] sm:max-w-[200px] leading-tight mt-0.5">
                  {selectedBranch.name.split("—")[0]}
                </span>
              </div>
              <ChevronsUpDown className="size-3 text-[var(--muted-foreground)] ml-1" />
            </Button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-76 rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                  <span>Chọn Chi Nhánh Vận Hành</span>
                  <Sparkles className="size-3 text-[var(--primary)]" />
                </div>
                <div className="space-y-1 mt-1">
                  {(SAMPLE_BRANCHES.length > 0 ? SAMPLE_BRANCHES : [DEFAULT_FALLBACK_BRANCH]).map((b) => (
                    <Button
                      key={b.id}
                      variant="ghost"
                      onClick={() => {
                        setSelectedBranch(b);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "flex h-auto w-full items-start justify-between rounded-xl p-2.5 text-left text-xs transition-colors",
                        selectedBranch.id === b.id
                          ? "bg-[var(--accent)] text-[var(--accent-foreground)] border border-[var(--primary)]/20"
                          : "hover:bg-[var(--secondary)] text-[var(--foreground)]"
                      )}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{b.code}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--secondary)] text-[var(--muted-foreground)] font-semibold">
                            {b.type}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1">
                          {b.name}
                        </span>
                      </div>
                      {selectedBranch.id === b.id && (
                        <Check className="size-4 text-[var(--primary)] shrink-0 mt-0.5" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[var(--secondary)] p-1 rounded-xl border border-[var(--border)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/branches" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[var(--card)] text-[var(--primary)] shadow-sm font-bold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Theme Toggle + User Menu */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-8 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
            title={theme === "dark" ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
          >
            {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-600" />}
          </Button>

          <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
            <Link href={"/me" as Route} className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
              <div className="size-8 rounded-xl bg-gradient-to-tr from-[#0284C7] to-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:ring-2 ring-[var(--primary)]/30">
                QL
              </div>
              <div className="hidden lg:flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">Nguyễn Văn Quản</span>
                <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-medium">Hồ sơ & Phân quyền</span>
              </div>
            </Link>
            <Link href="/login" className="text-[var(--muted-foreground)] hover:text-rose-500 ml-1 p-1 transition-colors" title="Đăng xuất">
              <LogOut className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
