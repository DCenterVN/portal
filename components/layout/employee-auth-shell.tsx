"use client";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import {NextIntlClientProvider, useTranslations} from "next-intl";
import Link from "next/link";
import type {ReactNode} from "react";
function Content({children}: {children: ReactNode}) {
 const t = useTranslations("employeeAuth");
 return <div data-auth-journey="employee" className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-ink)]">
  <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-(--z-toast) focus:bg-[var(--color-surface)] focus:p-3 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"> {t("skipContent")} </a>
  <main id="main" className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
   <div className="relative flex min-h-[468px] w-full max-w-[1100px] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
    <section aria-label={t("panelTitle")} className="relative hidden w-[460px] flex-none flex-col justify-between gap-6 bg-p p-10 text-on-p lg:flex">
     <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-sm border border-on-p"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3c-3 0-6 2.5-6 7 0 4 2.7 8 6 11 3.3-3 6-7 6-11 0-4.5-3-7-6-7z" /></svg></span>
      <span className="font-display text-xl font-bold">{t("brand")}</span>
     </div>
     <div>
      <p className="font-display text-[32px] font-bold leading-10">{t("panelTitle")}</p>
      <p className="mt-2 max-w-[32ch] opacity-90">{t("panelBody")}</p>
     </div>
     <p className="text-xs opacity-90">{t("panelNote")}</p>
     <svg viewBox="0 0 72 468" preserveAspectRatio="none" aria-hidden="true" className="absolute left-[calc(100%-1px)] top-0 h-full w-[72px] text-p"><path d="M0 0H10C62 78 66 150 34 232C6 306 26 392 12 468H0Z" fill="currentColor" /></svg>
    </section>
    <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-8 sm:px-14 lg:pl-28">
     <div className="mx-auto w-full max-w-[380px] space-y-3.5">
      <header className="space-y-1 lg:hidden"><Link href="/staff/login" className="inline-flex min-h-11 items-center font-display text-xl font-bold text-p-text"> {t("brand")} </Link></header>
      {children}
     </div>
    </div>
   </div>
  </main>
  <footer className="px-4 pb-5 text-center text-xs text-[var(--color-muted)]"> {t("support")} </footer>
 </div>;
}

export function EmployeeAuthShell({children, locale = "vi"}: {children: React.ReactNode; locale?: "vi" | "en"}) {
  const messages = locale === "en" ? enMessages : viMessages;
  return <NextIntlClientProvider locale={locale} messages={{employeeAuth: messages.employeeAuth}} timeZone="Asia/Ho_Chi_Minh"><Content>{children}</Content></NextIntlClientProvider>;
}
