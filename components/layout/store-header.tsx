"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Heart, Leaf, LogOut, Menu, Package, Search, UserRound, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { MenuItem, Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { isActive } from "./console-shell";
import { MiniCart, MOBILE_PANEL, type CartPreviewItem } from "./mini-cart";
import { ThemeToggle } from "./theme-toggle";

export type StoreNavItem = { href: string; label: string; match: string };

type Props = {
  nav: StoreNavItem[];
  pathname: string;
  user: { name: string } | null;
  cartHref: string;
  cartItems: CartPreviewItem[];
  favoritesCount: number;
  loginHref: string;
  /** Opens the customer auth popup; without it the button goes to `loginHref`. */
  onLoginClick?: () => void;
  /** The logout item shows only when the frame can log out. */
  onLogout?: () => void;
  menuOpen: boolean;
  onMenuToggle: () => void;
};

const ICON_TRIGGER = buttonVariants({ variant: "ghost", size: "icon" });

function Navigation({ nav, pathname, onSelect }: Pick<Props, "nav" | "pathname"> & { onSelect?: () => void }) {
  return (
    <nav aria-label="Chính" className="flex flex-col gap-1 md:flex-row md:items-center">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href as Route}
          aria-current={isActive(pathname, item.match) ? "page" : undefined}
          onClick={onSelect}
          className="relative flex min-h-11 items-center rounded-sm px-3 text-sm font-semibold text-fg-2 transition-colors duration-100 hover:text-fg aria-[current=page]:text-p-text after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-p after:opacity-0 after:content-[''] aria-[current=page]:after:opacity-100"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function SearchForm({ className }: { className?: string }) {
  return (
    <form role="search" action="/products" className={className}>
      <label className="relative block">
        <span className="sr-only">Tìm sản phẩm</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
        <input
          type="search"
          name="q"
          placeholder="Tìm món, nguyên liệu…"
          className="h-11 w-full rounded-sm border border-line-strong bg-l1 pl-9 pr-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-p md:h-10"
        />
      </label>
    </form>
  );
}

function AccountMenu({ user, favoritesCount, onLogout }: { user: { name: string } } & Pick<Props, "favoritesCount" | "onLogout">) {
  const router = useRouter();
  const links = [
    { href: "/me", label: "Tài khoản", icon: UserRound },
    { href: "/orders", label: "Đơn hàng", icon: Package },
    { href: "/favorites", label: `Yêu thích (${favoritesCount})`, icon: Heart },
  ];
  return (
    <Popover
      menu
      align="end"
      label={`Tài khoản của ${user.name}`}
      triggerClassName="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm px-1 text-sm font-bold text-fg hover:bg-l1-2 md:px-2"
      className={MOBILE_PANEL}
      trigger={
        <>
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full border border-p bg-p-soft text-xs font-extrabold text-p-text">
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-40 truncate md:inline">{user.name}</span>
        </>
      }
    >
      {links.map(({ href, label, icon: Icon }) => (
        <MenuItem key={href} onClick={() => router.push(href as Route)}>
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </MenuItem>
      ))}
      {onLogout && (
        <MenuItem onClick={onLogout} className="text-err">
          <LogOut className="size-4" aria-hidden="true" />
          Đăng xuất
        </MenuItem>
      )}
    </Popover>
  );
}

export function StoreHeader({ nav, pathname, user, cartHref, cartItems, favoritesCount, loginHref, onLoginClick, onLogout, menuOpen, onMenuToggle }: Props) {
  const router = useRouter();
  return (
    // ponytail: no sticky z token yet, borrows --z-popover (still under modal/toast). Add --z-sticky to globals.css.
    <header className="sticky top-0 z-(--z-popover) border-b border-glass-edge">
      {/* Glass on a back layer, not the header: a backdrop-filter ancestor would stop the L3 popovers from blurring the page. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-glass-l2 glass-blur-l2" />
      <div className="relative mx-auto flex h-15 w-full max-w-360 items-center gap-1 px-4 md:h-18 md:gap-6 md:px-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-2 md:hidden"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="store-mobile-menu"
          onClick={onMenuToggle}
        >
          {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </Button>
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2 text-p-text" aria-label="Việt Sạch, trang chủ">
          <Leaf className="size-5" aria-hidden="true" />
          <span className="font-heading text-lg font-bold text-fg">Việt Sạch</span>
        </Link>
        <div className="hidden md:block">
          <Navigation nav={nav} pathname={pathname} />
        </div>
        <SearchForm className="ml-auto hidden max-w-105 flex-1 md:block" />
        <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
          <div className="md:hidden">
            <Popover align="end" label="Tìm sản phẩm" triggerClassName={ICON_TRIGGER} className={cn("p-2", MOBILE_PANEL)} trigger={<Search className="size-5" aria-hidden="true" />}>
              <SearchForm />
            </Popover>
          </div>
          <MiniCart items={cartItems} cartHref={cartHref} />
          <ThemeToggle />
          {user ? (
            <AccountMenu user={user} favoritesCount={favoritesCount} onLogout={onLogout} />
          ) : (
            <Button type="button" variant="ghost" size="md" aria-label="Đăng nhập" aria-haspopup={onLoginClick ? "dialog" : undefined} onClick={onLoginClick ?? (() => router.push(loginHref as Route))}>
              <UserRound className="size-5" aria-hidden="true" />
              <span className="hidden md:inline">Đăng nhập</span>
            </Button>
          )}
        </div>
      </div>
      {menuOpen && (
        <div id="store-mobile-menu" className="relative border-t border-glass-edge px-4 py-3 md:hidden">
          <Navigation nav={nav} pathname={pathname} onSelect={onMenuToggle} />
        </div>
      )}
    </header>
  );
}
