import Link from "next/link";
import type { ReactNode } from "react";
import { Leaf } from "lucide-react";
import { AuthHeading } from "@/components/patterns/auth-heading";

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
  skipLinkLabel?: string;
  logoLabel?: string;
  legalText?: string;
};

function MiniFooter({ text }: { text: string }) {
  return (
    <footer className="px-4 pb-5 text-center text-xs text-[var(--muted-foreground)]">
      {text}
    </footer>
  );
}

export function AuthShell({
  children,
  title,
  description,
  skipLinkLabel = "Bỏ qua tới nội dung",
  logoLabel = "Việt Sạch",
  legalText = "© 2026 Việt Sạch",
}: Props) {
  return (
    <div data-surface="auth" className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:bg-[var(--surface)] focus:px-4 focus:py-2"
        href="#main"
      >
        {skipLinkLabel}
      </a>
      <main id="main" className="grid flex-1 place-items-center px-4 py-10 sm:px-6">
        <section className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <Link href="/" aria-label={logoLabel} className="mb-6 flex items-center justify-center gap-2 font-serif text-lg font-bold">
            <Leaf aria-hidden="true" className="size-5" />
            <span>{logoLabel}</span>
          </Link>
          {title && <AuthHeading title={title} subtitle={description} />}
          {children}
        </section>
      </main>
      <MiniFooter text={legalText} />
    </div>
  );
}
