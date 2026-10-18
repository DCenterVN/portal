"use client";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import {NextIntlClientProvider, useTranslations} from "next-intl";
import {Clock, Truck} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function Card({children, bare}: {children: ReactNode; bare?: boolean}) {
  const t = useTranslations("customerAuth");
  return (
  <section className={`grid w-full max-w-[880px] overflow-hidden bg-[var(--color-surface)] lg:grid-cols-[1.08fr_1fr] ${bare ? "" : "rounded-xl border border-[var(--color-line)] shadow-[var(--elevation-shadow-card)]"}`}>
    <div className="min-w-0 p-6 sm:p-10">
      <Link href="/" aria-label={t("brandLabel")} className="mb-5 inline-flex min-h-11 items-center gap-2.5 font-display text-xl font-bold text-fg">
        <span className="grid size-8 place-items-center rounded-lg bg-p text-on-p"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3c-3 0-6 2.5-6 7 0 4 2.7 8 6 11 3.3-3 6-7 6-11 0-4.5-3-7-6-7z" /></svg></span>
        {t("brand")}
      </Link>
      {children}
    </div>
    <aside aria-label={t("panelBadge")} className="hidden flex-col gap-5 bg-p-hover p-10 text-on-p lg:flex">
      <span className="inline-flex h-6 items-center self-start rounded-sm bg-l1 px-2.5 text-xs font-bold text-fg">{t("panelBadge")}</span>
      <div>
        <p className="font-display text-[32px] font-bold leading-10">{t("panelTitle")}</p>
        <p className="mt-2 max-w-[32ch] text-sm">{t("panelBody")}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 text-xs font-bold text-fg">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5"><Clock aria-hidden="true" className="size-4 text-p-text" />{t("chipTime")}</span>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5"><Truck aria-hidden="true" className="size-4 text-p-text" />{t("chipDelivery")}</span>
      </div>
    </aside>
  </section>
  );
}

function Content({children}: {children: ReactNode}) {
 const t = useTranslations("customerAuth");
  return (
    <div data-auth-journey="customer" className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-ink)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-(--z-toast) focus:rounded-md focus:bg-[var(--color-surface)] focus:p-3 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"> {t("skipContent")} </a>
      <main id="main" className="grid flex-1 place-items-center px-4 py-10 sm:px-6">
        <Card>{children}</Card>
      </main>
      <footer className="px-4 pb-5 text-center text-xs text-[var(--color-muted)]"> {t("copyright")} </footer>
    </div>
  );
}

export function CustomerAuthShell({children, locale = "vi"}: {children: React.ReactNode; locale?: "vi" | "en"}) {
  const messages = locale === "en" ? enMessages : viMessages;
  return <NextIntlClientProvider locale={locale} messages={{customerAuth: messages.customerAuth}} timeZone="Asia/Ho_Chi_Minh"><Content>{children}</Content></NextIntlClientProvider>;
}

export function CustomerAuthPopupBody({children, locale = "vi"}: {children: ReactNode; locale?: "vi" | "en"}) {
  const messages = locale === "en" ? enMessages : viMessages;
  return <NextIntlClientProvider locale={locale} messages={{customerAuth: messages.customerAuth}} timeZone="Asia/Ho_Chi_Minh"><Card bare>{children}</Card></NextIntlClientProvider>;
}
