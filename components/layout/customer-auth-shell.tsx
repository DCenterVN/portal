"use client";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import {NextIntlClientProvider, useTranslations} from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

function Content({children}: {children: ReactNode}) {
 const t = useTranslations("customerAuth");
  return (
    <div data-auth-journey="customer" className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-ink)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-(--z-toast) focus:rounded-md focus:bg-[var(--color-surface)] focus:p-3 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"> {t("skipContent")} </a>
      <main id="main" className="grid flex-1 place-items-center px-4 py-10 sm:px-6">
        <section className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--elevation-shadow-card)] sm:p-8">
          <Link href="/" aria-label={t("brandLabel")} className="mb-6 flex min-h-11 items-center justify-center font-display text-xl font-bold text-[var(--color-primary)]"> {t("brand")} </Link>
          {children}
        </section>
      </main>
      <footer className="px-4 pb-5 text-center text-xs text-[var(--color-muted)]"> {t("copyright")} </footer>
    </div>
  );
}

export function CustomerAuthShell({children, locale = "vi"}: {children: React.ReactNode; locale?: "vi" | "en"}) {
  const messages = locale === "en" ? enMessages : viMessages;
  return <NextIntlClientProvider locale={locale} messages={{customerAuth: messages.customerAuth}} timeZone="Asia/Ho_Chi_Minh"><Content>{children}</Content></NextIntlClientProvider>;
}
