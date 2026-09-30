import Link from "next/link";
import type { Route } from "next";
import { Leaf, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { isActive } from "./console-shell";

export type StoreNavItem = { href: string; label: string; match: string };

type Props = {
  nav: StoreNavItem[];
  pathname: string;
  user: { name: string } | null;
  cartHref: string;
  loginHref: string;
  menuOpen: boolean;
  onMenuToggle: () => void;
};

function Navigation({ nav, pathname, onSelect }: Pick<Props, "nav" | "pathname"> & { onSelect?: () => void }) {
  return (
    <nav aria-label="Chính" className="flex flex-col gap-1 md:flex-row md:items-center">
      {nav.map((item) => {
        const active = isActive(pathname, item.match);
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            aria-current={active ? "page" : undefined}
            onClick={onSelect}
            className="relative flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--primary)] after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-[var(--accent)] after:content-[''] after:opacity-0 aria-[current=page]:after:opacity-100"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SearchField() {
  return (
    <label className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 text-[var(--muted-foreground)] focus-within:border-[var(--ring)]">
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
        type="search"
        placeholder="Tìm món, nguyên liệu…"
        aria-label="Tìm kiếm"
      />
    </label>
  );
}

export function StoreHeader({ nav, pathname, user, cartHref, loginHref, menuOpen, onMenuToggle }: Props) {
  return (
    <header className="sticky top-0 flex min-h-14 flex-col border-b border-[var(--border)] bg-[var(--surface)] md:min-h-16">
      <div className="flex min-h-14 w-full items-center gap-2 px-4 md:min-h-16 md:gap-3 md:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2 text-[var(--primary)]" aria-label="Việt Sạch, trang chủ">
          <Leaf className="size-5" aria-hidden="true" />
          <span className="font-[var(--font-display)] text-lg font-bold">Việt Sạch</span>
        </Link>
        <div className="hidden md:block">
          <Navigation nav={nav} pathname={pathname} />
        </div>
        <div className="hidden min-w-0 max-w-64 flex-1 md:block">
          <SearchField />
        </div>
        <span className="flex-1 md:hidden" />
        {user ? (
          <Link href={"/me" as Route} className="hidden min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium hover:bg-[var(--secondary)] md:flex">
            <UserRound className="size-4" aria-hidden="true" />
            <span>{user.name}</span>
          </Link>
        ) : (
          <Link href={loginHref as Route} className="hidden min-h-11 items-center rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 md:flex">
            Đăng nhập
          </Link>
        )}
        <Link href={cartHref as Route} aria-label="Giỏ hàng" className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--secondary)]">
          <ShoppingBag className="size-5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--secondary)] md:hidden"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="store-mobile-menu"
          onClick={onMenuToggle}
        >
          {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {menuOpen && (
        <div id="store-mobile-menu" className="grid gap-3 border-t border-[var(--border)] px-4 py-3 md:hidden">
          <Navigation nav={nav} pathname={pathname} onSelect={onMenuToggle} />
          <SearchField />
          {user ? <Link href={"/me" as Route} className="flex min-h-11 items-center">{user.name}</Link> : <Link href={loginHref as Route} className="flex min-h-11 items-center">Đăng nhập</Link>}
        </div>
      )}
    </header>
  );
}
