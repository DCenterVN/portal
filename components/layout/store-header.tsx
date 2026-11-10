"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Heart, LogOut, Menu, Package, Search, Sun, UserRound, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tip } from "@/components/patterns/tip";
import { useHeaderProfile } from "@/lib/use-header-profile";
import { BRAND_NAME } from "@/lib/brand";
import { isActive } from "@/lib/navigation";
import { MiniCart, type CartPreviewItem } from "./mini-cart";
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
  onLoginClick?: () => void;
  onLogout?: () => void;
  menuOpen: boolean;
  onMenuToggle: () => void;
};

const ICON_TRIGGER = buttonVariants({ variant: "ghost", size: "icon", className: "size-11" });

function Navigation({ nav, pathname, onSelect }: Pick<Props, "nav" | "pathname"> & { onSelect?: () => void }) {
  return (
    <nav aria-label="Chính" className="flex flex-col gap-1 md:flex-row md:items-center">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href as Route}
          aria-current={isActive(pathname, item.match) ? "page" : undefined}
          onClick={onSelect}
          className={buttonVariants({ variant: "ghost", className: "store-nav-link relative min-h-11 max-md:justify-start aria-[current=page]:font-semibold aria-[current=page]:text-primary aria-[current=page]:hover:text-primary" })}
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
      <InputGroup className="store-search h-11 border-0 bg-muted/50 shadow-none has-[[data-slot=input-group-control]:focus-visible]:ring-1 has-[[data-slot=input-group-control]:focus-visible]:ring-ring">
        <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
        <InputGroupInput type="search" name="q" placeholder="Tìm món, nguyên liệu…" aria-label="Tìm sản phẩm" />
      </InputGroup>
    </form>
  );
}

function AccountMenu({ user, favoritesCount, onLogout }: { user: { name: string } } & Pick<Props, "favoritesCount" | "onLogout">) {
  const router = useRouter();
  const profile = useHeaderProfile(user);
  const links = [
    { href: "/me", label: "Tài khoản", icon: UserRound },
    { href: "/orders", label: "Đơn hàng", icon: Package },
    { href: "/favorites", label: `Yêu thích (${favoritesCount})`, icon: Heart },
  ];
  return (
    <DropdownMenu>
      <Tip label={`Tài khoản của ${profile.name}`}><DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Tài khoản của ${profile.name}`} className="size-11">
          <Avatar className="size-8">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
            <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">{profile.name.trim().charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger></Tip>
      <DropdownMenuContent align="end" className="min-w-48">
        {links.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} onSelect={() => router.push(href as Route)}>
            <Icon aria-hidden="true" />
            {label}
          </DropdownMenuItem>
        ))}
        {onLogout && (
          <DropdownMenuItem variant="destructive" onSelect={onLogout}>
            <LogOut aria-hidden="true" />
            Đăng xuất
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StoreHeader({ nav, pathname, user, cartHref, cartItems, favoritesCount, loginHref, onLoginClick, onLogout, menuOpen, onMenuToggle }: Props) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-(--z-header) bg-background">
      <div className="relative mx-auto flex h-15 w-full max-w-360 items-center gap-1 px-4 md:h-18 md:gap-6 md:px-10">
        <Tip label={menuOpen ? "Đóng menu" : "Mở menu"}><Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-2 size-11 md:hidden"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="store-mobile-menu"
          onClick={onMenuToggle}
        >
          {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </Button></Tip>
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label={`${BRAND_NAME}, trang chủ`}>
          <Sun aria-hidden="true" className="size-7 text-primary" /><span className="text-xl font-bold tracking-tight text-foreground">{BRAND_NAME}</span>
        </Link>
        <div className="hidden md:block">
          <Navigation nav={nav} pathname={pathname} />
        </div>
        <SearchForm className="ml-auto hidden max-w-105 flex-1 md:block" />
        <div className="store-header-actions ml-auto flex items-center gap-2 md:ml-0">
          <div className="md:hidden">
            <Popover>
              <PopoverTrigger aria-label="Tìm sản phẩm" className={ICON_TRIGGER}><Search className="size-5" aria-hidden="true" /></PopoverTrigger>
              <PopoverContent align="end" className="w-[calc(100vw-2rem)] p-2 sm:w-80"><SearchForm /></PopoverContent>
            </Popover>
          </div>
          <MiniCart items={cartItems} cartHref={cartHref} />
          <ThemeToggle />
          {user ? (
            <AccountMenu user={user} favoritesCount={favoritesCount} onLogout={onLogout} />
          ) : (
            <Button type="button" variant="ghost" aria-label="Đăng nhập" className="h-11 px-3 max-md:w-11" aria-haspopup={onLoginClick ? "dialog" : undefined} onClick={onLoginClick ?? (() => router.push(loginHref as Route))}>
              <UserRound className="size-5" aria-hidden="true" />
              <span className="hidden md:inline">Đăng nhập</span>
            </Button>
          )}
        </div>
      </div>
      {menuOpen && (
        <div id="store-mobile-menu" className="relative px-4 pb-4 pt-2 md:hidden">
          <Navigation nav={nav} pathname={pathname} onSelect={onMenuToggle} />
        </div>
      )}
    </header>
  );
}
