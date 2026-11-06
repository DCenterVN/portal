"use client";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AuthFrame } from "./auth-frame";

function Content({ children, bare }: { children: ReactNode; bare?: boolean }) {
  const t = useTranslations("customerAuth");
  return (
    <AuthFrame
      scope="customer"
      bare={bare}
      brand={t("brand")}
      brandLabel={t("brandLabel")}
      brandHref="/"
      skipLabel={t("skipContent")}
      footer={t("copyright")}
    >
      {children}
    </AuthFrame>
  );
}

export function CustomerAuthShell({ children, locale = "vi" }: { children: React.ReactNode; locale?: "vi" | "en" }) {
  const messages = locale === "en" ? enMessages : viMessages;
  return <NextIntlClientProvider locale={locale} messages={{ customerAuth: messages.customerAuth }} timeZone="Asia/Ho_Chi_Minh"><Content>{children}</Content></NextIntlClientProvider>;
}

export function CustomerAuthPopupBody({ children, locale = "vi" }: { children: ReactNode; locale?: "vi" | "en" }) {
  const messages = locale === "en" ? enMessages : viMessages;
  return <NextIntlClientProvider locale={locale} messages={{ customerAuth: messages.customerAuth }} timeZone="Asia/Ho_Chi_Minh"><Content bare>{children}</Content></NextIntlClientProvider>;
}
