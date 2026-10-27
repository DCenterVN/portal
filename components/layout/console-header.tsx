"use client";

import type { ReactNode } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { LogOut, PanelLeft, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItem, Popover } from "@/components/ui/popover";
import { ThemeToggle } from "./theme-toggle";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  toggleLabel: string;
  user: { name: string; detail?: string };
  accountHref?: string;
  /** The logout item shows only when the frame can log out. */
  onLogout?: () => void;
  actions?: ReactNode;
};

function AccountMenu({ user, accountHref, onLogout }: Pick<Props, "user" | "onLogout"> & { accountHref: string }) {
  const router = useRouter();
  return (
    <Popover
      menu
      align="end"
      label={`Tài khoản của ${user.name}`}
      triggerClassName="flex min-h-11 items-center gap-2 rounded-sm px-2 text-sm font-bold text-fg hover:bg-l1-2"
      trigger={
        <>
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full border border-p bg-p-soft text-xs font-extrabold text-p-text">
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-40 truncate text-left sm:block">
            {user.name}
            {user.detail && <span className="block truncate text-xs font-normal text-fg-3">{user.detail}</span>}
          </span>
        </>
      }
    >
      <MenuItem onClick={() => router.push(accountHref as Route)}>
        <UserRound className="size-4" aria-hidden="true" />
        Tài khoản
      </MenuItem>
      {onLogout && (
        <MenuItem onClick={onLogout} className="text-err">
          <LogOut className="size-4" aria-hidden="true" />
          Đăng xuất
        </MenuItem>
      )}
    </Popover>
  );
}

export function ConsoleHeader({ collapsed, onToggle, toggleLabel, user, accountHref = "/account", onLogout, actions }: Props) {
  return (
    // ponytail: same z as store-header (--z-popover) until globals.css gets --z-sticky.
    <header className="sticky top-0 z-(--z-popover) border-b border-glass-edge">
      {/* Glass on a back layer so the L3 account menu can still blur the page. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-glass-l2 glass-blur-l2" />
      <div className="relative flex h-15 items-center gap-3 px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          aria-controls="console-sidebar"
          onClick={onToggle}
        >
          <PanelLeft aria-hidden="true" />
        </Button>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {actions}
          <ThemeToggle />
          <AccountMenu user={user} accountHref={accountHref} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
