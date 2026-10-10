"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast";
import { StoreHeader, type StoreNavItem } from "./store-header";
import { SiteFooter, type SiteFooterContent } from "./site-footer";
import type { CartPreviewItem } from "./mini-cart";

type Props = {
  nav: StoreNavItem[];
  user: { name: string } | null;
  cartHref: string;
  loginHref: string;
  footer: SiteFooterContent;
  children: ReactNode;
  skipLinkLabel?: string;
  cartItems?: CartPreviewItem[];
  favoritesCount?: number;
  onLoginClick?: () => void;
  onLogout?: () => void;
};

export function StoreShell({
  nav,
  user,
  cartHref,
  loginHref,
  footer,
  children,
  skipLinkLabel = "Bỏ qua tới nội dung",
  cartItems = [],
  favoritesCount = 0,
  onLoginClick,
  onLogout,
}: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // Nested provider: store toasts sit bottom-centre, the root one (app/layout.tsx) stays CRM bottom-right.
    <ToastProvider placement="store">
      <div data-surface="store" className="flex min-h-screen flex-col bg-l0 text-fg">
        <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:bg-[var(--surface)] focus:px-4 focus:py-2" href="#main">
          {skipLinkLabel}
        </a>
        <StoreHeader
          nav={nav}
          pathname={pathname}
          user={user}
          cartHref={cartHref}
          cartItems={cartItems}
          favoritesCount={favoritesCount}
          loginHref={loginHref}
          onLoginClick={onLoginClick}
          onLogout={onLogout}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((open) => !open)}
        />
        <main id="main" className="mx-auto w-full max-w-360 flex-1 px-4 md:px-10">
          {children}
        </main>
        <SiteFooter footer={footer} />
      </div>
    </ToastProvider>
  );
}
