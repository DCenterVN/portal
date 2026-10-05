import {createTranslator} from "next-intl";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";

export function getTranslations(namespace: "customerAuth", locale: "vi" | "en" = "vi") {
  return createTranslator({locale, messages: locale === "en" ? enMessages : viMessages, namespace});
}

import type { ReactNode } from "react";
export function FormAlert({children, id}: {children: ReactNode; id?: string}) {
  return <p id={id} role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-danger)]">{children}</p>;
}
export function FormNotice({title, children}: {title: string; children: ReactNode}) {
  return <div role="status" className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-ink)]"><h2 className="font-display text-lg font-bold">{title}</h2><div className="space-y-3 text-sm">{children}</div></div>;
}

export function passwordError(password: string): string {
  if ([...password].length < 12) return "passwordTooShort";
  if (new TextEncoder().encode(password).length > 256) return "passwordTooLong";
  return "";
}
