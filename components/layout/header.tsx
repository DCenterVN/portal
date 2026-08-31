"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Snowflake,
  Search,
  Store,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronsUpDown,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { SAMPLE_BRANCHES, BranchInfo, DEFAULT_FALLBACK_BRANCH } from "@/components/navbar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onNotificationClick?: () => void;
}

export function Header({ onNotificationClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [selectedBranch, setSelectedBranch] = useState<BranchInfo>(
    SAMPLE_BRANCHES[0] || DEFAULT_FALLBACK_BRANCH
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  React.useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/80 dark:bg-[#121614]/80 backdrop-blur-xl px-4 sm:px-6 transition-colors">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <Link href="/branches" className="flex items-center gap-2.5 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2D5A27] to-[#4E9B44] text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <Snowflake className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base font-bold text-emerald-700 dark:text-emerald-400 leading-tight">
              Việt Sạch
            </span>
            <span className="text-[10px] font-semibold text-[var(--muted-foreground)] tracking-wider uppercase">
              Cold Chain Operations
            </span>
          </div>
        </Link>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center max-w-md w-full mx-6">
        <div className="relative w-full">
          <Search className="size-4 text-[var(--muted-foreground)] absolute left-3.5 top-2.5 pointer-events-none" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm đơn hàng, mã lô (#LOT-XX), nhà cung cấp..."
            className="pl-9 text-xs rounded-xl bg-[var(--secondary)]/60 border-[var(--border)] focus:bg-[var(--card)] transition-colors h-9"
          />
        </div>
      </div>

      {/* Right Controls: Branch Switcher, Bell, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Branch Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            aria-controls="branch-switcher-list"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/50 px-2.5 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--secondary)]"
          >
            <Store className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold hidden sm:inline">{selectedBranch.code}</span>
            <span className="text-[11px] text-[var(--muted-foreground)] truncate max-w-[120px] hidden lg:inline">
              {selectedBranch.name.split("—")[0]}
            </span>
            <ChevronsUpDown className="size-3 text-[var(--muted-foreground)]" />
          </Button>

          {dropdownOpen && (
            <div
              id="branch-switcher-list"
              role="listbox"
              aria-label="Chọn Chi Nhánh Vận Hành"
              className="absolute right-0 top-full mt-1.5 w-72 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95"
            >
              <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                <span>Chọn Chi Nhánh Vận Hành</span>
                <Sparkles className="size-3 text-emerald-500" />
              </div>
              <div className="space-y-1 mt-1">
                {SAMPLE_BRANCHES.map((b) => (
                  <Button
                    key={b.id}
                    variant="ghost"
                    size="sm"
                    role="option"
                    aria-selected={selectedBranch.id === b.id}
                    onClick={() => {
                      setSelectedBranch(b);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "flex h-auto w-full items-start justify-between rounded-xl p-2 text-left text-xs transition-colors",
                      selectedBranch.id === b.id
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold"
                        : "hover:bg-[var(--secondary)] text-[var(--foreground)]"
                    )}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span>{b.code}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
                          {b.tempZone}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--muted-foreground)] mt-0.5 truncate max-w-[200px]">
                        {b.name}
                      </span>
                    </div>
                    {selectedBranch.id === b.id && (
                      <Check className="size-3.5 text-emerald-500 shrink-0 mt-1" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onNotificationClick}
          className="relative size-9 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
          title="Thông báo hệ thống"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-rose-500 ring-2 ring-[var(--card)]" />
        </Button>

        {/* Theme Toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="size-9 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
          title={theme === "dark" ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
        >
          {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-600" />}
        </Button>

        {/* User Profile Tile */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
          <Link
            href="/me"
            className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
            title="Xem Hồ sơ & Phân quyền"
          >
            <div className="size-8 rounded-xl bg-gradient-to-tr from-[#2D5A27] to-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-xs group-hover:ring-2 ring-emerald-500/30">
              NV
            </div>
            <div className="hidden xl:flex flex-col text-left leading-none">
              <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Nguyễn Văn Quản
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-medium">
                Quản lý kho cấp đông
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="text-[var(--muted-foreground)] hover:text-rose-500 p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
