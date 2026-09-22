import type { ReactNode } from "react";

export interface PublicShellProps {
  children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col">
      <nav className="z-header sticky top-0 flex h-16 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-panel)]/80 px-6 backdrop-blur-xl">
        <span className="font-serif text-xl font-bold text-[var(--color-teal)]">Việt Sạch</span>
        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Đăng nhập
          </a>
          <a
            href="/register"
            className="rounded-lg bg-[var(--color-teal)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-teal-2)] transition-colors"
          >
            Đăng ký
          </a>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--color-line)] bg-[var(--color-panel-strong)] px-6 py-8">
        <p className="text-center text-sm text-[var(--color-muted)]">
          © 2026 Việt Sạch. Chuỗi cung ứng thực phẩm sạch & chuỗi lạnh an toàn.
        </p>
      </footer>
    </div>
  );
}
