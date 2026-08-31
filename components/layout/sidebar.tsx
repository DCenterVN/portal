"use client";

import React from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  Truck,
  ShieldCheck,
  Users2,
  Building2,
  Users,
  KeyRound,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Package,
  ShoppingCart,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isOperations?: boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    label: "Tổng quan Chi nhánh",
    href: "/branches",
    icon: Building2,
  },
  {
    label: "Sản phẩm & Bán hàng",
    href: "/products",
    icon: Package,
    badge: "Sales",
    isOperations: true,
  },
  {
    label: "Giỏ hàng",
    href: "/cart",
    icon: ShoppingCart,
  },
  {
    label: "Đơn hàng",
    href: "/orders",
    icon: ClipboardList,
  },
  {
    label: "Kiểm nhận Hàng hoá",
    href: "/goods-receipt",
    icon: Truck,
    badge: "05",
    isOperations: true,
  },
  {
    label: "Kiểm định QC & Lô",
    href: "/qc-decision",
    icon: ShieldCheck,
    badge: "06",
    isOperations: true,
  },
  {
    label: "Nhà cung cấp & Chuỗi lạnh",
    href: "/suppliers",
    icon: Users2,
    badge: "07",
    isOperations: true,
  },
  {
    label: "Quản lý Thành viên",
    href: "/memberships",
    icon: Users,
  },
  {
    label: "Vai trò & Phân quyền",
    href: "/roles",
    icon: KeyRound,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  branchName?: string;
  branchCode?: string;
}

export function Sidebar({
  collapsed,
  onToggle,
  branchName = "Kho Lạnh Tân Thuận",
  branchCode = "CN-HCM-01",
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-[var(--border)] bg-[var(--card)]/90 dark:bg-[#151a17]/90 backdrop-blur-xl transition-all duration-300 z-30 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Top Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--border)]">
        {!collapsed ? (
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-3" />
              <span>Hệ Thống Vận Hành</span>
            </div>
            <div className="text-xs font-bold text-[var(--foreground)] truncate mt-0.5" title={branchName}>
              {branchCode} · {branchName}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            VS
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {!collapsed && (
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Phân hệ nghiệp vụ
          </div>
        )}

        {MAIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/branches" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200",
                collapsed ? "justify-center px-2" : "justify-between",
                isActive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs font-bold"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0",
                    isActive
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[var(--border)] space-y-2">
        <Link
          href="/me"
          title={collapsed ? "Cài đặt & Hồ sơ" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && <span>Cài đặt hệ thống</span>}
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 rounded-xl text-xs text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <>
              <ChevronLeft className="size-4" />
              <span>Thu gọn thanh bên</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
