"use client";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AuthFrame } from "./auth-frame";

function Content({ children }: { children: ReactNode }) {
  const t = useTranslations("employeeAuth");
  return (
    <AuthFrame
      scope="employee"
      brand={t("brand")}
      brandHref="/staff/login"
      skipLabel={t("skipContent")}
      footer={t("support")}
    >
      {children}
    </AuthFrame>
  );
}

export function EmployeeAuthShell({ children, locale = "vi" }: { children: React.ReactNode; locale?: "vi" | "en" }) {
  const messages = locale === "en" ? enMessages : viMessages;
  return <NextIntlClientProvider locale={locale} messages={{ employeeAuth: messages.employeeAuth }} timeZone="Asia/Ho_Chi_Minh"><Content>{children}</Content></NextIntlClientProvider>;
}
