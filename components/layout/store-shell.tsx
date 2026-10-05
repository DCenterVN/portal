"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { StoreHeader, type StoreNavItem } from "./store-header";
import { SiteFooter, type SiteFooterContent } from "./site-footer";

type Props = {
  nav: StoreNavItem[];
  user: { name: string } | null;
  cartHref: string;
  loginHref: string;
  footer: SiteFooterContent;
  children: ReactNode;
  skipLinkLabel?: string;
};

export function StoreShell({
  nav,
  user,
  cartHref,
  loginHref,
  footer,
  children,
  skipLinkLabel = "Bỏ qua tới nội dung",
}: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div data-surface="store" className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:bg-[var(--surface)] focus:px-4 focus:py-2" href="#main">
        {skipLinkLabel}
      </a>
      <StoreHeader
        nav={nav}
        pathname={pathname}
        user={user}
        cartHref={cartHref}
        loginHref={loginHref}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
      />
      <main id="main" className="mx-auto w-full max-w-screen-xl flex-1 px-4 md:px-6 lg:px-8">
        {children}
      </main>
      <SiteFooter footer={footer} />
    </div>
  );
}
