"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell } from "@dcentervn/ui";
import { useAuthSession } from "@dcentervn/auth-react";

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthSession();

  const navItems = [
    { href: "/ops/dashboard", label: "Tổng quan", icon: "📊" },
    { href: "/dev/components", label: "Component Gallery", icon: "🎨" },
  ];

  const sidebar = (
    <div className="flex h-full flex-col justify-between p-2">
      <nav aria-label="Vận hành" className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-semibold"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-panel-strong)] hover:text-[var(--color-ink)]"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-line)] pt-4 mt-auto">
        {user && (
          <div className="mb-3 px-3">
            <p className="truncate text-xs font-semibold text-[var(--color-ink)]">
              {user.displayName || "Quản trị viên"}
            </p>
            <p className="truncate text-[11px] text-[var(--color-muted)]">
              {user.email}
            </p>
          </div>
        )}
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
        >
          <span>🚪</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return <AppShell sidebar={sidebar} title="Việt Sạch Ops">{children}</AppShell>;
}
