import type { ReactNode } from "react";

export interface StorefrontShellProps {
  children: ReactNode;
}

export function StorefrontShell({ children }: StorefrontShellProps) {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col">
      <header className="z-header sticky top-0 flex h-14 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-panel)]/80 px-6 backdrop-blur-xl">
        <span className="font-serif text-lg font-bold text-[var(--color-teal)]">Cửa hàng Việt Sạch</span>
      </header>
      <main className="flex-1 pb-20">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-header flex h-16 items-center justify-around border-t border-[var(--color-line)] bg-[var(--color-panel)]/95 backdrop-blur-md">
        <a href="/" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-teal)]">Trang chủ</a>
        <a href="/products" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-teal)]">Sản phẩm</a>
        <a href="/cart" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-teal)]">Giỏ hàng</a>
        <a href="/login" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-teal)]">Tài khoản</a>
      </nav>
    </div>
  );
}
