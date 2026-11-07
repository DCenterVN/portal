"use client";

import { NextIntlClientProvider } from "next-intl";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import { EmailConfirmView } from "./email-confirm-view";

type EmailConfirmClientProps = { locale: "vi" | "en" };
export function EmailConfirmClient({ locale }: EmailConfirmClientProps) {
  const messages = locale === "en" ? enMessages : viMessages;
  return <NextIntlClientProvider locale={locale} messages={{ account: messages.account }} timeZone="Asia/Ho_Chi_Minh"><EmailConfirmView /></NextIntlClientProvider>;
}
